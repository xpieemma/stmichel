// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: {
				DB: D1Database;
				
			};
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Error {}
		interface Locals {
			admin?: string | null;
			user?: { id: number; username: string } | null;
		}
		
		interface PageData {}
		interface PageState {}
	}
}

export {};
