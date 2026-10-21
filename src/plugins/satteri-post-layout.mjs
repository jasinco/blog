import { defineHastPlugin } from 'satteri';

const HEADING_RE = /^h([1-6])$/i;

function createChevronSvgHast() {
	return {
		type: 'element',
		tagName: 'svg',
		properties: {
			className: ['fold-chevron'],
			viewBox: '0 0 16 16',
			width: '12',
			height: '12',
			fill: 'none',
			stroke: 'currentColor',
			'stroke-width': '2.2',
			'stroke-linecap': 'round',
			'stroke-linejoin': 'round',
			'aria-hidden': 'true',
		},
		children: [
			{
				type: 'element',
				tagName: 'path',
				properties: {
					d: 'M6 3.5l4.5 4.5-4.5 4.5',
				},
				children: [],
			},
		],
	};
}

function createCopyButtonHast() {
	return {
		type: 'element',
		tagName: 'button',
		properties: {
			type: 'button',
			className: ['code-copy'],
			'aria-label': 'Copy code',
		},
		children: [
			{
				type: 'element',
				tagName: 'svg',
				properties: {
					viewBox: '0 0 16 16',
					width: '13',
					height: '13',
					fill: 'none',
					stroke: 'currentColor',
					'stroke-width': '1.5',
					'stroke-linejoin': 'round',
					'aria-hidden': 'true',
				},
				children: [
					{
						type: 'element',
						tagName: 'rect',
						properties: { x: '5.5', y: '5.5', width: '8', height: '8', rx: '1.5' },
						children: [],
					},
					{
						type: 'element',
						tagName: 'path',
						properties: { d: 'M10.5 5.5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2' },
						children: [],
					},
				],
			},
			{
				type: 'element',
				tagName: 'span',
				properties: { className: ['code-copy-label'] },
				children: [{ type: 'text', value: 'copy' }],
			},
		],
	};
}

function hasMeaningfulChildren(children) {
	return children.some(
		(child) => !(child.type === 'text' && (!child.value || child.value.trim() === ''))
	);
}

/**
 * Compile-time Sätteri HAST plugin that:
 * 1. Wraps markdown `<table>` elements in an accessible scrollable `.table-wrapper`,
 *    and code blocks in a bordered `.code-block` with a copy button.
 * 2. Groups headings (`<h1>`–`<h6>`) and their following content into hierarchical
 *    collapsible `.fold-section` containers so zero runtime DOM restructuring is needed.
 */
export default function satteriPostLayout() {
	return defineHastPlugin({
		name: 'satteri-post-layout',
		element: {
			filter: ['table', 'pre'],
			visit(node, ctx) {
				if (node.tagName === 'pre') {
					const classes = node.properties?.className || [];
					if (classes.includes('mermaid-error')) return;
					ctx.wrapNode(node, {
						type: 'element',
						tagName: 'div',
						properties: { className: ['code-block'] },
						children: [createCopyButtonHast()],
					});
					return;
				}
				ctx.wrapNode(node, {
					type: 'element',
					tagName: 'div',
					properties: {
						className: ['table-wrapper'],
						role: 'region',
						'aria-label': 'Data table',
						tabIndex: 0,
					},
					children: [],
				});
			},
		},
		after(root, ctx) {
			const children = root.children || [];
			const hasHeadings = children.some(
				(child) => child.type === 'element' && HEADING_RE.test(child.tagName)
			);
			if (!hasHeadings) return;

			const rootChildren = [];
			const sections = [];
			const stack = [{ level: 0, children: rootChildren }];

			for (const child of children) {
				const match =
					child.type === 'element' ? HEADING_RE.exec(child.tagName) : null;
				if (match) {
					const level = Number.parseInt(match[1], 10);

					while (stack.length > 1 && stack[stack.length - 1].level >= level) {
						stack.pop();
					}

					const parentChildren = stack[stack.length - 1].children;

					const toggleBtn = {
						type: 'element',
						tagName: 'button',
						properties: {
							type: 'button',
							className: ['fold-toggle'],
							'aria-expanded': 'true',
							'aria-label': 'Toggle section',
						},
						children: [createChevronSvgHast()],
					};

					const badgeBtn = {
						type: 'element',
						tagName: 'button',
						properties: {
							type: 'button',
							className: ['fold-badge'],
							'aria-label': 'Unfold section',
							title: 'Click to expand',
						},
						children: [{ type: 'text', value: '···' }],
					};

					const headerDiv = {
						type: 'element',
						tagName: 'div',
						properties: {
							className: ['fold-header'],
						},
						children: [toggleBtn, child, badgeBtn],
					};

					const foldBodyChildren = [];
					const foldBodyDiv = {
						type: 'element',
						tagName: 'div',
						properties: {
							className: ['fold-body'],
						},
						children: foldBodyChildren,
					};

					const sectionEl = {
						type: 'element',
						tagName: 'section',
						properties: {
							className: ['fold-section'],
							'data-level': String(level),
						},
						children: [headerDiv, foldBodyDiv],
					};

					parentChildren.push(sectionEl);
					sections.push({ sectionEl, foldBodyChildren });
					stack.push({ level, children: foldBodyChildren });
				} else {
					stack[stack.length - 1].children.push(child);
				}
			}

			for (const { sectionEl, foldBodyChildren } of sections) {
				if (!hasMeaningfulChildren(foldBodyChildren)) {
					sectionEl.properties.className.push('is-empty');
				}
			}

			ctx.replaceNode(root, {
				type: 'root',
				children: rootChildren,
			});
		},
	});
}
