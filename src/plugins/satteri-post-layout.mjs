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

function hasMeaningfulChildren(children) {
	return children.some(
		(child) => !(child.type === 'text' && (!child.value || child.value.trim() === ''))
	);
}

/**
 * Compile-time Sätteri HAST plugin that:
 * 1. Wraps markdown `<table>` elements in an accessible scrollable `.table-wrapper`.
 * 2. Groups headings (`<h1>`–`<h6>`) and their following content into hierarchical
 *    collapsible `.fold-section` containers so zero runtime DOM restructuring is needed.
 */
export default function satteriPostLayout() {
	return defineHastPlugin({
		name: 'satteri-post-layout',
		element: {
			filter: ['table'],
			visit(node, ctx) {
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
