<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { Search, ArrowDown, ArrowUp } from 'lucide-svelte';
	import { documentsApiSearchPagesOptions } from "$lib/api/@tanstack/svelte-query.gen";

	let { placeholder = "Search documents and pages..." } = $props();

	let searchQuery = $state('');
	let showDropdown = $state(false);
	let selectedIndex = $state(-1);
	let searchInput: HTMLInputElement;

	// Function to render snippet with simple markdown and highlighting
	function renderSnippet(snippet: string, searchQuery: string): string {
		if (!snippet) return '';

		// Truncate for dropdown
		const truncated = snippet.length > 120 ? snippet.substring(0, 120) + '...' : snippet;

		// Simple markdown conversion
		let html = truncated
			.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
			.replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
			.replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>') // Code
			.replace(/\n/g, '<br>'); // Line breaks

		// Apply highlighting
		return html.replace(new RegExp(`(${searchQuery})`, 'gi'), '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
	}

	// Search query - only trigger when user has typed something
	const searchQueryData = $derived(createQuery({
		...documentsApiSearchPagesOptions({
			query: { q: searchQuery }
		}),
		enabled: searchQuery.trim().length > 2 // Only search when 3+ characters
	}));

	// Flatten results for arrow key navigation
	let flatResults = $derived.by(() => {
		if (!$searchQueryData.data?.documents) return [];
		const results: Array<{ type: 'document' | 'page', document: any, page?: any, index: number }> = [];
		let index = 0;

		$searchQueryData.data.documents.forEach(document => {
			results.push({ type: 'document', document, index: index++ });
			document.pages.forEach((page: any) => {
				results.push({ type: 'page', document, page, index: index++ });
			});
		});

		return results;
	});

	function handleInput() {
		selectedIndex = -1;
		showDropdown = searchQuery.trim().length > 2;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!showDropdown) {
			if (event.key === 'Enter') {
				event.preventDefault();
				if (searchQuery.trim()) {
					goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
					closeDropdown();
				}
			}
			return;
		}

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = Math.min(selectedIndex + 1, flatResults.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = Math.max(selectedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0 && selectedIndex < flatResults.length) {
					const selected = flatResults[selectedIndex];
					if (selected.type === 'page' && selected.page) {
						goto(`/documents/${selected.document.sqid}?page=${selected.page.page_number}`);
					} else {
						goto(`/documents/${selected.document.sqid}`);
					}
					closeDropdown();
				} else if (searchQuery.trim()) {
					goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
					closeDropdown();
				}
				break;
			case 'Escape':
				closeDropdown();
				break;
		}
	}

	function closeDropdown() {
		showDropdown = false;
		selectedIndex = -1;
		searchInput?.blur();
	}

	function handleDocumentClick(document: any) {
		goto(`/documents/${document.sqid}`);
		closeDropdown();
	}

	function handlePageClick(document: any, page: any) {
		goto(`/documents/${document.sqid}?page=${page.page_number}`);
		closeDropdown();
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		if (!event.target || !(event.target as Element).closest('.search-dropdown')) {
			closeDropdown();
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative search-dropdown">
	<div class="relative">
		<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
			<Search class="h-5 w-5 text-gray-400" />
		</div>
		<input
			bind:this={searchInput}
			type="text"
			bind:value={searchQuery}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => { if (searchQuery.trim().length > 2) showDropdown = true; }}
			placeholder={placeholder}
			class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
		/>
	</div>

	{#if showDropdown}
		<div class="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
			{#if $searchQueryData.isLoading}
				<div class="p-4 text-center text-gray-500">
					<div class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
					<span class="ml-2">Searching...</span>
				</div>
			{:else if $searchQueryData.error}
				<div class="p-4 text-center text-red-600 text-sm">
					Error searching. Please try again.
				</div>
			{:else if !$searchQueryData.data?.documents || $searchQueryData.data.documents.length === 0}
				<div class="p-4 text-center text-gray-500 text-sm">
					No results found for "{searchQuery}"
				</div>
				<div class="border-t border-gray-200 p-3 text-center">
					<button
						onclick={() => { goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`); closeDropdown(); }}
						class="text-blue-600 hover:text-blue-700 text-sm font-medium"
					>
						Go to detailed search
					</button>
				</div>
			{:else}
				<!-- Results -->
				<div class="max-h-80 overflow-y-auto">
					{#each $searchQueryData.data.documents.slice(0, 3) as document, docIndex}
						<!-- Document Header -->
						<button
							class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors"
							class:bg-blue-50={selectedIndex === flatResults.find(r => r.type === 'document' && r.document.sqid === document.sqid)?.index}
							onclick={() => handleDocumentClick(document)}
							type="button"
						>
							<div class="flex items-start space-x-3">
								<div class="flex-shrink-0">
									{#if document.thumbnail}
										<img
											src={document.thumbnail}
											alt={document.title}
											class="h-8 w-8 object-cover rounded border"
										/>
									{:else}
										<div class="h-8 w-8 bg-gray-100 rounded border flex items-center justify-center">
											<Search class="h-4 w-4 text-gray-400" />
										</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<h4 class="text-sm font-medium text-gray-900 truncate">{document.title}</h4>
									<p class="text-xs text-gray-500">{document.pages.length} page{document.pages.length !== 1 ? 's' : ''} found</p>
								</div>
							</div>
						</button>

						<!-- Top 2 Pages for this document -->
						{#each document.pages.slice(0, 2) as page}
							{@const pageResultIndex = flatResults.find(r => r.type === 'page' && r.page?.sqid === page.sqid)?.index}
							<button
								class="w-full px-8 py-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
								class:bg-blue-50={selectedIndex === pageResultIndex}
								onclick={() => handlePageClick(document, page)}
								type="button"
							>
								<div class="flex items-center space-x-2 text-xs text-gray-600 mb-1">
									<span>Page {page.page_number}</span>
									{#if page.relevance_score}
										<span>•</span>
										<span>{Math.round(page.relevance_score * 100)}% match</span>
									{/if}
								</div>
								{#if page.snippet}
									<div class="text-sm text-gray-800 leading-relaxed line-clamp-2">
										{@html renderSnippet(page.snippet, searchQuery)}
									</div>
								{/if}
							</button>
						{/each}
					{/each}
				</div>

				<!-- Footer -->
				<div class="border-t border-gray-200 p-3 text-center bg-gray-50">
					<button
						onclick={() => { goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`); closeDropdown(); }}
						class="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center justify-center space-x-1"
					>
						<span>View all results</span>
						<ArrowDown class="h-3 w-3" />
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
