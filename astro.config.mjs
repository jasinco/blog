// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';
import satteriTypst from './src/plugins/satteri-typst.mjs';
import satteriMermaid from './src/plugins/satteri-mermaid.mjs';
import satteriPostLayout from './src/plugins/satteri-post-layout.mjs';

import cloudflare from '@astrojs/cloudflare';

import * as fs from "node:fs";
import takumi, { presets } from 'astro-takumi';

// https://astro.build/config
export default defineConfig({
	site: 'https://blog.jasinco.work',

	markdown: {
		processor: satteri({
			features: {
				gfm: true,
				math: true
			},
			mdastPlugins: [satteriTypst(), satteriMermaid()],
			hastPlugins: [satteriPostLayout()]
		})
	},

	vite: {
		plugins: [tailwindcss()],
		optimizeDeps: {
			exclude: ['@myriaddreamin/typst-ts-node-compiler']
		},
		ssr: {
			optimizeDeps: {
				exclude: ['@myriaddreamin/typst-ts-node-compiler']
			}
		}
	},

	adapter: cloudflare(),
	integrations: [
		takumi({
			options: {
				fonts: [
					fs.readFileSync('./public/fonts/ioskeley/IoskeleyMono-Regular.woff2'),
					// Japanese fallback for titles like 一人の言葉 (Ioskeley has no CJK glyphs)
					fs.readFileSync('./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-400-normal.woff2'),
				],
			},
			render: presets.blackAndWhite,
		}),
	],
});
