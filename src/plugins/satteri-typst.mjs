import { fileURLToPath } from 'node:url';
import { defineMdastPlugin } from 'satteri';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';

const FONTS_DIR = fileURLToPath(new URL('../assets/fonts', import.meta.url));

/**
 * Cache for compiled formulas to speed up builds
 * @type {Map<string, string>}
 */
const formulaCache = new Map();

let compilerInstance = null;

function getCompiler() {
	if (!compilerInstance) {
		compilerInstance = NodeCompiler.create({
			fontArgs: [{ fontPaths: [FONTS_DIR] }],
		});
	}
	return compilerInstance;
}

function toHex(color) {
	if (!color) return 'ffffff';
	if (color.toLowerCase() === 'white') return 'ffffff';
	if (color.toLowerCase() === 'black') return '000000';
	return color.replace('#', '');
}

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Reads the per-block scale from a fence's meta string, e.g. "```typst size=2" or "$$ size=1.5".
 */
function metaScale(meta) {
	const match = meta?.match(/(?:^|\s)size=([\d.]+)(?=\s|$)/);
	const size = match ? parseFloat(match[1]) : NaN;
	return Number.isFinite(size) && size > 0 ? size : 1;
}

/**
 * Compiles Typst math code to SVG and computes baseline position for inline math.
 * Handles auto-defining unknown multi-letter variables and catching errors.
 */
function compileTypstMath(code, displayMode, textColor = '#ffffff', displayScale = 1.4) {
	const cacheKey = `${displayMode ? 'display' : 'inline'}:${textColor}:${displayScale}:${code}`;
	if (formulaCache.has(cacheKey)) {
		return formulaCache.get(cacheKey);
	}

	const hexColor = toHex(textColor);
	const compiler = getCompiler();
	let preamble = '';

	for (let attempt = 0; attempt < 5; attempt++) {
		const template = displayMode
			? `#set page(height: auto, width: auto, margin: 0pt, fill: none)
#set text(font: "New Computer Modern", fill: rgb("${hexColor}"))
#show math.equation: set text(font: "New Computer Modern Math")
${preamble}
$ ${code} $`
			: `#set page(height: auto, width: auto, margin: 0pt, fill: none)
#set text(font: "New Computer Modern", fill: rgb("${hexColor}"))
#show math.equation: set text(font: "New Computer Modern Math")
#let s = state("t", (:))
#let pin(t) = context {
  let width = measure(line(length: here().position().y)).width
  s.update(it => it.insert(t, width) + it)
}
#show math.equation: it => {
  box(it, inset: (top: 0.5em, bottom: 0.5em))
}
${preamble}
$pin("l1")${code}$
#context [
  #metadata(s.final().at("l1")) <label>
]`;

		const docRes = compiler.compile({ mainFileContent: template });
		if (docRes.result) {
			const doc = docRes.result;
			let rawSvg = compiler.svg(doc);

			// Scope global `svg { fill: none; }` to `.typst-doc { fill: none; }`
			rawSvg = rawSvg.replace(/svg\s*\{\s*fill:\s*none;\s*\}/g, '.typst-doc { fill: none; }');

			// Replace any black strokes (fraction bars, square root lines, arrows) with text color
			rawSvg = rawSvg.replace(/stroke="#000(000)?"/gi, `stroke="${textColor}"`);

			// Replace any black fills with text color
			rawSvg = rawSvg.replace(/fill="#000(000)?"/gi, `fill="${textColor}"`);

			// Ensure glyph fills and strokes match text color
			rawSvg = rawSvg.replace(/--glyph_fill:\s*[^;]+;/g, `--glyph_fill: ${textColor};`);
			rawSvg = rawSvg.replace(/--glyph_stroke:\s*[^;]+;/g, `--glyph_stroke: ${textColor};`);

			let baselinePosition;
			if (!displayMode) {
				const query = compiler.query(doc, { selector: '<label>' });
				if (query && query[0] && query[0].value) {
					baselinePosition = parseFloat(query[0].value);
				}
			}

			const defaultEm = 11;
			const widthMatch = rawSvg.match(/data-width="([^"]+)"/) || rawSvg.match(/width="([^"]+)"/);
			const heightMatch = rawSvg.match(/data-height="([^"]+)"/) || rawSvg.match(/height="([^"]+)"/);
			const width = parseFloat(widthMatch ? widthMatch[1] : 0);
			const height = parseFloat(heightMatch ? heightMatch[1] : 0);

			let finalHtml = rawSvg;
			if (displayMode) {
				const scaledWidth = ((width / defaultEm) * displayScale).toFixed(3);
				const style = `overflow: visible; width: ${scaledWidth}em; height: auto; display: block; color: ${textColor};`;
				finalHtml = finalHtml.replace(/<svg\b([^>]*)>/, (m, attrs) => {
					const cleaned = attrs.replace(/\bclass="[^"]*"/, '').replace(/\bstyle="[^"]*"/, '').trim();
					return `<svg class="typst-doc typst-display" style="${style}" ${cleaned}>`;
				});
				finalHtml = `<div class="typst-display-wrapper">${finalHtml}</div>`;
			} else {
				const shift = height - (baselinePosition ?? height);
				const shiftEm = (shift / defaultEm).toFixed(3);
				const style = `overflow: visible; vertical-align: -${shiftEm}em; height: ${(height / defaultEm).toFixed(3)}em; width: ${(width / defaultEm).toFixed(3)}em; display: inline-block; color: ${textColor};`;
				finalHtml = finalHtml.replace(/<svg\b([^>]*)>/, (m, attrs) => {
					const cleaned = attrs.replace(/\bclass="[^"]*"/, '').replace(/\bstyle="[^"]*"/, '').trim();
					return `<svg class="typst-doc typst-inline" style="${style}" ${cleaned}>`;
				});
			}

			formulaCache.set(cacheKey, finalHtml);
			return finalHtml;
		}

		const diags = compiler.fetchDiagnostics(docRes.takeDiagnostics());
		let resolvedUnknownVar = false;

		for (const d of diags) {
			const match = d.message?.match(/unknown variable: ([a-zA-Z0-9_]+)/);
			if (match) {
				const varName = match[1];
				if (!preamble.includes(`#let ${varName} =`)) {
					preamble += `#let ${varName} = math.italic("${varName}")\n`;
					resolvedUnknownVar = true;
				}
			}
		}

		if (!resolvedUnknownVar) {
			const errMsg = diags.map((d) => d.message).join('; ');
			throw new Error(errMsg || 'Failed to compile Typst math');
		}
	}

	throw new Error('Exceeded maximum attempts resolving variables in Typst math');
}

/**
 * Sätteri MDAST plugin to render Typst math expressions in Markdown.
 */
export default function satteriTypst(options = {}) {
	const textColor = options.color || '#ffffff';
	const errorColor = options.errorColor || '#ef4444';
	const displayScale = options.displayScale ?? 1.4;

	return defineMdastPlugin({
		name: 'satteri-typst',
		inlineMath(node, ctx) {
			let value = (node.value || '').trim();
			if (value.startsWith('$') && value.endsWith('$')) {
				value = value.slice(1, -1).trim();
			}
			try {
				const html = compileTypstMath(value, false, textColor, displayScale);
				ctx.replaceNode(node, { type: 'html', value: html });
			} catch (err) {
				ctx.report({
					message: `Could not render typst math: ${err.message}`,
					node,
					severity: 'warning'
				});
				ctx.replaceNode(node, {
					type: 'html',
					value: `<span class="typst-error" style="color: ${errorColor};" title="${escapeHtml(err.message)}">${escapeHtml(value)}</span>`
				});
			}
		},
		math(node, ctx) {
			let value = (node.value || '').trim();
			if (value.startsWith('$$') && value.endsWith('$$')) {
				value = value.slice(2, -2).trim();
			}
			if (!value.includes('&') && value.includes('\n')) {
				value = value
					.split(/\r?\n/)
					.map((line) => (line.trim() ? `& ${line}` : line))
					.join('\n');
			}
			try {
				const html = compileTypstMath(value, true, textColor, displayScale * metaScale(node.meta));
				ctx.replaceNode(node, { type: 'html', value: html });
			} catch (err) {
				ctx.report({
					message: `Could not render typst math: ${err.message}`,
					node,
					severity: 'warning'
				});
				ctx.replaceNode(node, {
					type: 'html',
					value: `<div class="typst-error" style="color: ${errorColor}; margin: 1em 0;" title="${escapeHtml(err.message)}">${escapeHtml(value)}</div>`
				});
			}
		},
		code(node, ctx) {
			if (node.lang === 'typst' || node.lang === 'math') {
				let value = (node.value || '').trim();
				try {
					const html = compileTypstMath(value, true, textColor, displayScale * metaScale(node.meta));
					ctx.replaceNode(node, { type: 'html', value: html });
				} catch (err) {
					ctx.report({
						message: `Could not render typst math code block: ${err.message}`,
						node,
						severity: 'warning'
					});
					ctx.replaceNode(node, {
						type: 'html',
						value: `<div class="typst-error" style="color: ${errorColor}; margin: 1em 0;" title="${escapeHtml(err.message)}">${escapeHtml(value)}</div>`
					});
				}
			}
		}
	});
}
