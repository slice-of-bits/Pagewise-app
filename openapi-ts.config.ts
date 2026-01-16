import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: 'http://127.0.0.1:8000/api/openapi.json',
	output: 'src/lib/api',
	plugins: [
		{
			name: '@tanstack/svelte-query',
		}
	],
});