<script lang="ts">
	let {
		bucketFilter = $bindable(''),
		documentFilter = $bindable(''),
		limit = $bindable(20),
		buckets = [],
		documents = [],
		onUpdate
	} = $props();

	function handleUpdateFilters() {
		onUpdate({ bucketFilter, documentFilter, limit });
	}

	function clearFilters() {
		bucketFilter = '';
		documentFilter = '';
		limit = 20;
		onUpdate({ bucketFilter: '', documentFilter: '', limit: 20 });
	}

	// Filter documents by bucket when bucket filter changes
	let filteredDocuments = $derived(bucketFilter
		? documents.filter(doc => doc.group_sqid === bucketFilter)
		: documents);
</script>

<div class="bg-white rounded-lg border border-gray-200 p-6">
	<div class="flex items-center justify-between mb-4">
		<h3 class="text-lg font-medium text-gray-900">Search Filters</h3>
		<button
			onclick={clearFilters}
			class="text-sm text-gray-600 hover:text-gray-800"
		>
			Clear all
		</button>
	</div>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
		<!-- Bucket Filter -->
		<div>
			<label for="bucket-filter" class="block text-sm font-medium text-gray-700 mb-1">
				Bucket
			</label>
			<select
				id="bucket-filter"
				bind:value={bucketFilter}
				onchange={handleUpdateFilters}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="">All buckets</option>
				{#each buckets as bucket (bucket.sqid)}
					<option value={bucket.sqid}>{bucket.name}</option>
				{/each}
			</select>
		</div>

		<!-- Document Filter -->
		<div>
			<label for="document-filter" class="block text-sm font-medium text-gray-700 mb-1">
				Document
			</label>
			<select
				id="document-filter"
				bind:value={documentFilter}
				onchange={handleUpdateFilters}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
			>
				<option value="">All documents</option>
				{#each filteredDocuments as document (document.sqid)}
					<option value={document.sqid}>{document.title}</option>
				{/each}
			</select>
		</div>

		<!-- Results per page -->
		<div>
			<label for="limit-filter" class="block text-sm font-medium text-gray-700 mb-1">
				Results per page
			</label>
			<select
				id="limit-filter"
				bind:value={limit}
				onchange={handleUpdateFilters}
				class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
			>
				<option value={10}>10</option>
				<option value={20}>20</option>
				<option value={50}>50</option>
				<option value={100}>100</option>
			</select>
		</div>
	</div>

	{#if bucketFilter || documentFilter}
		<div class="mt-4 flex flex-wrap gap-2">
			{#if bucketFilter}
				{@const bucket = buckets.find(b => b.sqid === bucketFilter)}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
					Bucket: {bucket?.name || 'Unknown'}
					<button
						onclick={() => { bucketFilter = ''; handleUpdateFilters(); }}
						class="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
					>
						×
					</button>
				</span>
			{/if}

			{#if documentFilter}
				{@const document = documents.find(d => d.sqid === documentFilter)}
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
					Document: {document?.title || 'Unknown'}
					<button
						onclick={() => { documentFilter = ''; handleUpdateFilters(); }}
						class="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
					>
						×
					</button>
				</span>
			{/if}
		</div>
	{/if}
</div>
