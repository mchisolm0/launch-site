import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel/static';

export default defineConfig({
  site: 'https://launch.sow.care',
  output: 'static',
  adapter: vercel(),
});
