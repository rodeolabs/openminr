import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit()
	],
	server: {
		// Allow connection from Docker containers or standard localhost
		allowedHosts: ['host.docker.internal', 'localhost']
	}
});
