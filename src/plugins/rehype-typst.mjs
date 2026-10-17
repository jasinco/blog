import { fromHtmlIsomorphic } from 'hast-util-from-html-isomorphic';
import { toText } from 'hast-util-to-text';
import { NodeCompiler } from '@myriaddreamin/typst-ts-node-compiler';
import { visitParents } from 'unist-util-visit-parents';

/**
 * Cache for compiled formulas to speed up builds
 * @type {Map<string, { svg: string, baselinePosition?: number }>}
 */
const formulaCache = new Map();

let compilerInstance = null;

function getCompiler() {
	if (!compilerInstance) {
		compilerInstance = NodeCompiler.create();
	}
	return compilerInstance;
}

function toHex(color) {
	if (!color) return 'ffffff';
	if (color.toLowerCase() === 'white') return 'ffffff';
	if (color.toLowerCase() === 'black') return '000000';
	return color.replace('#', '');
}

/**
 * Compiles Typst math code to SVG and computes baseline position for inline math.
 * Handles auto-defining unknown multi-letter variables and catching errors.
 */
function compileTypstMath(code, displayMode, textColor = '#ffffff') {
	const cacheKey = `${displayMode ? 'display' : 'inline'}:${textColor}:${code}`;
	if (formulaCache.has(cacheKey)) {
		return formulaCache.get(cacheKey);
	}

	const hexColor = toHex(textColor);
	const compiler = getCompiler();
	let preamble = '';

	for (let attempt = 0; attempt < 5; attempt++) {
		const template = displayMode
			? `#set page(height: auto, width: auto, margin: 0pt, fill: none)
#set text(fill: rgb("${hexColor}"))
${preamble}
$ ${code} $`
			: `#set page(height: auto, width: auto, margin: 0pt, fill: none)
#set text(fill: rgb("${hexColor}"))
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
			rawSvg = rawSvg.replace(
				/--glyph_fill:\s*[^;]+;/g,
				`--glyph_fill: ${textColor};`
			);
			rawSvg = rawSvg.replace(
				/--glyph_stroke:\s*[^;]+;/g,
				`--glyph_stroke: ${textColor};`
			);

			let baselinePosition;
			if (!displayMode) {
				const query = compiler.query(doc, { selector: '<label>' });
				if (query && query[0] && query[0].value) {
					baselinePosition = parseFloat(query[0].value);
				}
			}

			const res = { svg: rawSvg, baselinePosition };
			formulaCache.set(cacheKey, res);
			return res;
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
 * Rehype plugin to render Typst math expressions in Markdown.
 */
export default function rehypeTypst(options = {}) {
	const textColor = options.color || '#ffffff';
	const errorColor = options.errorColor || '#ef4444';
	const displayScale = options.displayScale ?? 1.4;

	return async function (tree, file) {
		const matches = [];

		visitParents(tree, 'element', (element, parents) => {
			const classes = Array.isArray(element.properties?.className)
				? element.properties.className
				: [];

			const isMathCode = classes.includes('language-math') || classes.includes('language-typst');
			const isMathDisplay = classes.includes('math-display');
			const isMathInline = classes.includes('math-inline');

			if (isMathCode || isMathDisplay || isMathInline) {
				matches.push({ element, parents, isMathCode, isMathDisplay, isMathInline });
			}
		});

		for (const { element, parents, isMathCode, isMathDisplay } of matches) {
			let parent = parents[parents.length - 1];
			let scope = element;
			let displayMode = isMathDisplay;

			if (
				element.tagName === 'code' &&
				isMathCode &&
				parent &&
				parent.type === 'element' &&
				parent.tagName === 'pre'
			) {
				scope = parent;
				parent = parents[parents.length - 2];
				displayMode = true;
			}

			if (!parent) continue;

			let value = toText(scope, { whitespace: 'pre' }).trim();
			// If code was wrapped in $ ... $ or $$ ... $$, strip the outer $ for cleaner typst compiling
			if (value.startsWith('$$') && value.endsWith('$$')) {
				value = value.slice(2, -2).trim();
			} else if (value.startsWith('$') && value.endsWith('$')) {
				value = value.slice(1, -1).trim();
			}

			let replacementNodes;

			try {
				const result = compileTypstMath(value, displayMode, textColor);
				const hastRoot = fromHtmlIsomorphic(result.svg, { fragment: true });
				const svgEl = hastRoot.children.find((c) => c.type === 'element' && c.tagName === 'svg');

				if (svgEl) {
					const defaultEm = 11;
					const height = parseFloat(svgEl.properties['dataHeight'] || svgEl.properties['height'] || 0);
					const width = parseFloat(svgEl.properties['dataWidth'] || svgEl.properties['width'] || 0);

					if (!svgEl.properties.className) {
						svgEl.properties.className = [];
					} else if (!Array.isArray(svgEl.properties.className)) {
						svgEl.properties.className = [svgEl.properties.className];
					}

					let existingStyle = (svgEl.properties.style || '').toString().trim();
					if (existingStyle && !existingStyle.endsWith(';')) existingStyle += ';';

					if (displayMode) {
						svgEl.properties.className.push('typst-display');
						const scaledWidth = ((width / defaultEm) * displayScale).toFixed(3);
						svgEl.properties.style = `${existingStyle} width: ${scaledWidth}em; max-width: 100%; height: auto; display: block; margin: 0 auto; color: ${textColor};`;
						replacementNodes = [
							{
								type: 'element',
								tagName: 'div',
								properties: {
									className: ['typst-display-wrapper'],
									style: 'overflow-x: auto; margin: 1.6em 0; text-align: center;'
								},
								children: [svgEl]
							}
						];
					} else {
						svgEl.properties.className.push('typst-inline');
						const shift = height - (result.baselinePosition ?? height);
						const shiftEm = shift / defaultEm;
						svgEl.properties.style = `${existingStyle} vertical-align: -${shiftEm}em; height: ${height / defaultEm}em; width: ${width / defaultEm}em; display: inline-block; color: ${textColor};`;
						replacementNodes = [svgEl];
					}
				} else {
					replacementNodes = hastRoot.children;
				}
			} catch (err) {
				file.message(`Could not render typst math: ${err.message}`, {
					ancestors: [...parents, element],
					cause: err,
					place: element.position,
					source: 'rehype-typst'
				});

				replacementNodes = [
					{
						type: 'element',
						tagName: 'span',
						properties: {
							className: ['typst-error'],
							style: `color: ${errorColor};`,
							title: String(err.message || err)
						},
						children: [{ type: 'text', value }]
					}
				];
			}

			const index = parent.children.indexOf(scope);
			if (index !== -1) {
				parent.children.splice(index, 1, ...replacementNodes);
			}
		}
	};
}
