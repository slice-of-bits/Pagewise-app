<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import Header from '$lib/components/Header.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

    import { client } from '$lib/api/client.gen';
    import { PUBLIC_API_HOST } from '$env/static/public';
    import {browser} from "$app/environment";

    client.setConfig({
        baseUrl: PUBLIC_API_HOST
    });

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
            },
        },
    })

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-gray-50">
		<Header />
		<ProgressBar />
		<main class="container mx-auto px-4 py-8">
			{@render children()}
		</main>
	</div>
</QueryClientProvider>
