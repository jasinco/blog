import { createElement as h } from 'react';

// Mirrors the site tokens in src/styles/global.css
const colors = {
	canvas: '#111311',
	surface: '#1c201d',
	ink: '#f0f0e8',
	softInk: '#a9ada5',
	line: 'rgba(240, 240, 232, .14)',
	greenWash: '#263028',
	greenInk: '#b8d2ad',
};

const font = '"Ioskeley Mono", "Noto Sans JP"';
const brand = '一人の言葉';
const domain = 'blog.jasinco.work';

const textOf = (document, selector) => document.querySelector(selector)?.textContent?.trim() ?? '';

/** Open Graph renderer for astro-takumi: dark sheet on a dot grid, matching the landing page. */
export async function renderOgImage({ title, description, document }) {
	const date = textOf(document, '.post-sheet-meta');
	const tags = [...document.querySelectorAll('.post-tag-link')].map((el) => el.textContent.trim()).slice(0, 4);
	const isPost = Boolean(date);
	const titleSize = title.length > 28 ? 64 : 84;

	return h(
		'div',
		{
			style: {
				width: '100%',
				height: '100%',
				display: 'flex',
				padding: 40,
				backgroundColor: colors.canvas,
				// Dot grid, echoing the animated landing background
				backgroundImage: `radial-gradient(circle, rgba(184, 210, 173, .28) 1.6px, transparent 2px)`,
				backgroundSize: '30px 30px',
				backgroundPosition: '15px 15px',
				fontFamily: font,
				color: colors.ink,
			},
		},
		h(
			'div',
			{
				style: {
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					backgroundColor: colors.surface,
					border: `1px solid ${colors.line}`,
					borderRadius: 6,
					boxShadow: '0 24px 60px rgba(0, 0, 0, .45)',
				},
			},
			// Top bar: brand + date, like the site header
			h(
				'div',
				{
					style: {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '26px 48px',
						borderBottom: `1px solid ${colors.line}`,
						fontSize: 28,
					},
				},
				h('div', { style: { display: 'flex', fontWeight: 700, color: colors.ink } }, brand),
				h('div', { style: { display: 'flex', color: colors.softInk } }, isPost ? date : '~/notes'),
			),
			// Title + excerpt
			h(
				'div',
				{
					style: {
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
						padding: '0 48px',
					},
				},
				h(
					'div',
					{ style: { display: 'flex', fontSize: 30, color: colors.greenInk, marginBottom: 14 } },
					isPost ? '$ cat note' : '$ whoami',
				),
				h(
					'div',
					{
						style: {
							display: 'block',
							fontSize: titleSize,
							fontWeight: 600,
							lineHeight: 1.08,
							letterSpacing: '-0.02em',
							lineClamp: 2,
						},
					},
					title,
				),
				description &&
					h(
						'div',
						{
							style: {
								display: 'block',
								marginTop: 22,
								fontSize: 32,
								lineHeight: 1.35,
								color: colors.softInk,
								lineClamp: 2,
							},
						},
						description,
					),
			),
			// Bottom bar: tags + domain
			h(
				'div',
				{
					style: {
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						padding: '22px 48px',
						borderTop: `1px solid ${colors.line}`,
						fontSize: 24,
					},
				},
				h(
					'div',
					{ style: { display: 'flex', gap: 12 } },
					...tags.map((tag) =>
						h(
							'div',
							{
								style: {
									display: 'flex',
									padding: '6px 14px',
									borderRadius: 4,
									backgroundColor: colors.greenWash,
									color: colors.greenInk,
								},
							},
							tag,
						),
					),
				),
				h('div', { style: { display: 'flex', color: colors.softInk } }, domain),
			),
		),
	);
}
