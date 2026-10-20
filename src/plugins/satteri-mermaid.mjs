import { createHash } from 'node:crypto';
import { defineMdastPlugin } from 'satteri';
import { render } from 'pele';

function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/**
 * Sätteri MDAST plugin that renders ```mermaid code blocks to SVG at build time with Pele.
 * Colors and fonts come from the --pele-* CSS variables in global.css.
 */
export default function satteriMermaid() {
	return defineMdastPlugin({
		name: 'satteri-mermaid',
		code(node, ctx) {
			if (node.lang !== 'mermaid') return;
			const source = (node.value || '').trim();
			try {
				// Unique per diagram so marker/gradient ids don't collide when a page has several
				const idPrefix = `m${createHash('sha1').update(source).digest('hex').slice(0, 8)}-`;
				const { svg } = render(source, { idPrefix });
				ctx.replaceNode(node, { type: 'html', value: `<div class="mermaid-diagram">${svg}</div>` });
			} catch (err) {
				ctx.report({
					message: `Could not render mermaid diagram: ${err.message}`,
					node,
					severity: 'warning'
				});
				ctx.replaceNode(node, {
					type: 'html',
					value: `<pre class="mermaid-error" title="${escapeHtml(err.message)}">${escapeHtml(source)}</pre>`
				});
			}
		}
	});
}
