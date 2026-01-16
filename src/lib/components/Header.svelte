<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Search, Menu, FileText, Plus } from 'lucide-svelte';

	let searchQuery = $state('');
	let showMobileMenu = $state(false);

	function handleSearch(event: Event) {
		event.preventDefault();
		if (searchQuery.trim()) {
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	function handleQuickSearch(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			goto(`/search?q=${encodeURIComponent(searchQuery.trim())}&preview=true`);
		}
	}
</script>

<header class="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- Logo and Navigation -->
			<div class="flex items-center space-x-8">
				<a href="/" class="flex items-center space-x-2 text-xl font-bold text-gray-900">
					<FileText class="h-6 w-6 text-blue-600" />
					<span>Pagewise</span>
				</a>

				<!-- Desktop Navigation -->
				<nav class="hidden space-x-6 md:flex">
					<a
						href="/"
						class="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
						class:text-blue-600={$page.url.pathname === '/'}
						class:text-gray-700={$page.url.pathname !== '/'}
					>
						Home
					</a>
					<a
						href="/buckets"
						class="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
						class:text-blue-600={$page.url.pathname.startsWith('/buckets')}
						class:text-gray-700={!$page.url.pathname.startsWith('/buckets')}
					>
						Buckets
					</a>
					<a
						href="/documents"
						class="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
						class:text-blue-600={$page.url.pathname.startsWith('/documents')}
						class:text-gray-700={!$page.url.pathname.startsWith('/documents')}
					>
						Documents
					</a>
				</nav>
			</div>

			<!-- Search Bar -->
			<div class="flex-1 max-w-2xl mx-8 hidden md:block">
				<form onsubmit={handleSearch} class="relative">
					<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
						<Search class="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						bind:value={searchQuery}
						onkeydown={handleQuickSearch}
						placeholder="Search documents and pages... (Press Enter for quick preview)"
						class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
					/>
					{#if searchQuery.trim()}
						<div class="absolute right-2 top-1/2 -translate-y-1/2">
							<button
								type="submit"
								class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
							>
								Search
							</button>
						</div>
					{/if}
				</form>
			</div>

			<!-- Action Buttons -->
			<div class="flex items-center space-x-4">
				<button
					onclick={() => goto('/upload')}
					class="hidden sm:flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
				>
					<Plus class="h-4 w-4" />
					<span>Upload</span>
				</button>

				<!-- Mobile menu button -->
				<button
					onclick={() => showMobileMenu = !showMobileMenu}
					class="md:hidden rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
				>
					<Menu class="h-6 w-6" />
				</button>
			</div>
		</div>

		<!-- Mobile Navigation Menu -->
		{#if showMobileMenu}
			<div class="border-t border-gray-200 pb-3 pt-4 md:hidden">
				<!-- Mobile Search -->
				<div class="px-2 pb-4">
					<form onsubmit={handleSearch}>
						<div class="relative">
							<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
								<Search class="h-5 w-5 text-gray-400" />
							</div>
							<input
								type="text"
								bind:value={searchQuery}
								placeholder="Search documents and pages..."
								class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>
					</form>
				</div>

				<!-- Mobile Navigation Links -->
				<div class="space-y-1 px-2">
					<a
						href="/"
						onclick={() => showMobileMenu = false}
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
						class:bg-blue-50={$page.url.pathname === '/'}
						class:text-blue-600={$page.url.pathname === '/'}
					>
						Home
					</a>
					<a
						href="/buckets"
						onclick={() => showMobileMenu = false}
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
						class:bg-blue-50={$page.url.pathname.startsWith('/buckets')}
						class:text-blue-600={$page.url.pathname.startsWith('/buckets')}
					>
						Buckets
					</a>
					<a
						href="/documents"
						onclick={() => showMobileMenu = false}
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
						class:bg-blue-50={$page.url.pathname.startsWith('/documents')}
						class:text-blue-600={$page.url.pathname.startsWith('/documents')}
					>
						Documents
					</a>
					<a
						href="/upload"
						onclick={() => showMobileMenu = false}
						class="block rounded-md px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50"
					>
						Upload Document
					</a>
				</div>
			</div>
		{/if}
	</div>
</header>
