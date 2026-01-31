import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// Standard alias mapping for clean imports across the project
		alias: {
			"$components": "src/lib/components",
			"$components/*": "src/lib/components/*",
			"$lib": "src/lib",
			"$lib/*": "src/lib/*"
		}
	}
};

export default config;
