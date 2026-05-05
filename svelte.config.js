import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {

preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
  platformProxy: {
    configPath: 'wrangler.toml',
    persist: '.wrangler/state'
  }
}),
		typescript: {
			config: (config) => ({
				...config,
				include: [...config.include, '../drizzle.config.ts']
			})
		},
    alias: {
       '$lib': './src/lib',
  '$lib/*': './src/lib/*',
  '$components': './src/lib/components',
  '$components/*': './src/lib/components/*'
    }
  },

	compilerOptions: {
		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	
	// preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx', '.md'] })],
	extensions: ['.svelte', '.svx', '.md']
};

export default config;
