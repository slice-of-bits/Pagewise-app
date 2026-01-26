<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Menu, FileText, Plus } from 'lucide-svelte';
	import SearchDropdown from './SearchDropdown.svelte';

	let showMobileMenu = $state(false);
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
					<a
						href="/system/settings"
						class="text-sm font-medium text-gray-700 transition-colors hover:text-blue-600"
						class:text-blue-600={$page.url.pathname.startsWith('/system')}
						class:text-gray-700={!$page.url.pathname.startsWith('/system')}
					>
						Settings
					</a>
				</nav>
			</div>

			<!-- Search Bar -->
			<div class="flex-1 max-w-2xl mx-8 hidden md:block">
				<SearchDropdown placeholder="Search documents and pages..." />
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
					<SearchDropdown placeholder="Search documents and pages..." />
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
						href="/system/settings"
						onclick={() => showMobileMenu = false}
						class="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
						class:bg-blue-50={$page.url.pathname.startsWith('/system')}
						class:text-blue-600={$page.url.pathname.startsWith('/system')}
					>
						Settings
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
