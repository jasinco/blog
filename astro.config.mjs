// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeTypst from './src/plugins/rehype-typst.mjs';

// https://astro.build/config
export default defineConfig({
	markdown: {
		processor: unified({
			remarkPlugins: [remarkMath],
			rehypePlugins: [rehypeTypst]
		})
	},
	vite: {
		plugins: [tailwindcss()]
	}
});
