// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { satteri } from '@astrojs/markdown-satteri';
import satteriTypst from './src/plugins/satteri-typst.mjs';
import satteriPostLayout from './src/plugins/satteri-post-layout.mjs';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  markdown: {
      processor: satteri({
          features: {
              gfm: true,
              math: true
          },
          mdastPlugins: [satteriTypst()],
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

  adapter: cloudflare()
});