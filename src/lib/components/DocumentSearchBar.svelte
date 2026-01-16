<script lang="ts">
	import { Search, X } from 'lucide-svelte';

	let {
		searchQuery = $bindable(''),
		searchResults = [],
		isLoading = false,
		onResultClick
	} = $props();

	let showResults = $state(false);
	let inputRef: HTMLInputElement;

	function handleInput() {
		showResults = searchQuery.trim().length > 0;
	}

	function clearSearch() {
		searchQuery = '';
		showResults = false;
	}

	function handleResultClick(pageNumber: number) {
		onResultClick?.(pageNumber);
		showResults = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			clearSearch();
		}
	}

	// Close results when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.search-container')) {
			showResults = false;
		}
	}

	$effect(() => {
		if (typeof window !== 'undefined') {
			if (showResults) {
				document.addEventListener('click', handleClickOutside);
			} else {
				document.removeEventListener('click', handleClickOutside);
			}

			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

<div class="relative search-container">
	<div class="relative">
		<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
			<Search class="h-4 w-4 text-gray-400" />
		</div>
		<input
			bind:this={inputRef}
			type="text"
			bind:value={searchQuery}
			oninput={handleInput}
			onkeydown={handleKeydown}
			placeholder="Search within this document..."
			class="block w-64 pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
		/>
		{#if searchQuery}
			<button
				onclick={clearSearch}
				class="absolute inset-y-0 right-0 flex items-center pr-3"
			>
				<X class="h-4 w-4 text-gray-400 hover:text-gray-600" />
			</button>
		{/if}
	</div>

	<!-- Search Results Dropdown -->
	{#if showResults}
		<div class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
			{#if isLoading}
				<div class="p-4 text-center">
					<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
					<p class="mt-2 text-sm text-gray-600">Searching...</p>
				</div>
			{:else if searchResults.length === 0 && searchQuery.trim()}
				<div class="p-4 text-center text-sm text-gray-500">
					No results found for "{searchQuery}"
				</div>
			{:else if searchResults.length > 0}
				<div class="py-2">
					<div class="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
						{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
					</div>
					{#each searchResults as result (result.page_sqid)}
						<button
							onclick={() => handleResultClick(result.page_number)}
							class="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
						>
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium text-gray-900">
									Page {result.page_number}
								</span>
								<!--{#if result.confidence_score}-->
								<!--	<span class="text-xs text-gray-500">-->
								<!--		{Math.round(result.confidence_score * 100)}% match-->
								<!--	</span>-->
								<!--{/if}-->
							</div>
							{#if result.matched_text}
								<div class="text-xs text-gray-600 mt-1 line-clamp-2">
									{result.matched_text}
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>

