// @ts-check
import { defineConfig } from 'astro/config';

// Output "services.html" style files so every existing URL stays identical.
export default defineConfig({
  site: 'https://tandmbak.com',
  trailingSlash: 'ignore',
  build: { format: 'file' },
  devToolbar: { enabled: false },
});
