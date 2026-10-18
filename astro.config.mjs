// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';
import satteriTypst from './src/plugins/satteri-typst.mjs';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  markdown: {
      processor: satteri({
          features: {
              gfm: true,
              math: true
          },
          mdastPlugins: [satteriTypst()]
      })
	},

  vite: {
      plugins: [tailwindcss()]
	},

  adapter: cloudflare()
});