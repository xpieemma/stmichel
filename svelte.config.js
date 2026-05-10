
// import adapter from '@sveltejs/adapter-cloudflare';
// import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// /** @type {import('@sveltejs/kit').Config} */
// const config = {

// preprocess: vitePreprocess(),
//   kit: {
//     adapter: adapter({
//   platformProxy: {
//     configPath: 'wrangler.toml',
//     persist: '.wrangler/state'
//   }
// }),
// csp: {
//       directives: {
//         'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
//         'font-src': ['self', 'https://fonts.gstatic.com', 'data:']
//       }
//     },
// 		typescript: {
// 			config: (config) => ({
// 				...config,
// 				include: [...config.include, '../drizzle.config.ts']
// 			})
// 		},
//     alias: {
//        '$lib': './src/lib',
//   '$lib/*': './src/lib/*',
//   '$components': './src/lib/components',
//   '$components/*': './src/lib/components/*'
//     }
//   },

// 	compilerOptions: {
// 		// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
// 		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
// 	},
	
// 	// preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx', '.md'] })],
// 	extensions: ['.svelte', '.svx', '.md']
// };

// export default config;


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
    // I DELETED THE CSP BLOCK FROM HERE
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
    runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
  },
  
  extensions: ['.svelte', '.svx', '.md']
};

export default config;