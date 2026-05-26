import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  server: {
    // Limit request body size to prevent DoS via large payloads
    // 1MB for API requests, images handled separately with their own limits
    bodySizeLimit: 1024 * 1024,
  },
});
