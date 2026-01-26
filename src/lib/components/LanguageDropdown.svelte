<script lang="ts">
	import ISO6391 from 'iso-639-1';
	import { createEventDispatcher } from 'svelte';
	import { ChevronDown, Search } from 'lucide-svelte';

	interface Props {
		value: string;
		placeholder?: string;
		label?: string;
		helpText?: string;
	}

	let { value = $bindable('eng'), placeholder = 'Search language...', label, helpText }: Props = $props();

	const dispatch = createEventDispatcher<{ change: string }>();

	let isOpen = $state(false);
	let searchQuery = $state('');

	// Get all languages with their codes
	const allLanguages = ISO6391.getAllCodes().map(code => ({
		code,
		name: ISO6391.getName(code),
		nativeName: ISO6391.getNativeName(code)
	}));

	// Add common OCR language codes that might not be in ISO-639-1
	const additionalLanguages = [
		{ code: 'chi_sim', name: 'Chinese (Simplified)', nativeName: '简体中文' },
		{ code: 'chi_tra', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
		{ code: 'jpn', name: 'Japanese', nativeName: '日本語' },
		{ code: 'kor', name: 'Korean', nativeName: '한국어' },
	];

	const languages = [...allLanguages, ...additionalLanguages].sort((a, b) => a.name.localeCompare(b.name));

	let filteredLanguages = $derived(
		searchQuery.trim()
			? languages.filter(lang =>
				lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				lang.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
				lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: languages
	);

	let selectedLanguage = $derived(
		languages.find(lang => lang.code === value) || null
	);

	function selectLanguage(code: string) {
		value = code;
		isOpen = false;
		searchQuery = '';
		dispatch('change', code);
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.language-dropdown')) {
			isOpen = false;
			searchQuery = '';
		}
	}

	$effect(() => {
		if (isOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="language-dropdown">
	{#if label}
		<label for="language-select" class="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
	{/if}

	<div class="relative">
		<button
			type="button"
			id="language-select"
			onclick={() => isOpen = !isOpen}
			class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
		>
			<span class="block truncate">
				{#if selectedLanguage}
					{selectedLanguage.name} ({selectedLanguage.code})
				{:else}
					Select language...
				{/if}
			</span>
			<ChevronDown class="h-4 w-4 text-gray-400" />
		</button>

		{#if isOpen}
			<div class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60">
				<div class="p-2 border-b border-gray-200">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder={placeholder}
							class="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						/>
					</div>
				</div>

				<div class="max-h-48 overflow-y-auto">
					{#if filteredLanguages.length > 0}
						{#each filteredLanguages as lang (lang.code)}
							<button
								type="button"
								onclick={() => selectLanguage(lang.code)}
								class="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
								class:bg-blue-100={value === lang.code}
							>
								<span class="flex items-center justify-between">
									<span class="text-sm text-gray-900">{lang.name}</span>
									<span class="text-xs text-gray-500">{lang.code}</span>
								</span>
								<span class="block text-xs text-gray-500">{lang.nativeName}</span>
							</button>
						{/each}
					{:else}
						<div class="px-3 py-4 text-sm text-gray-500 text-center">
							No languages found
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	{#if helpText}
		<p class="mt-1 text-sm text-gray-500">
			{helpText}
		</p>
	{/if}
</div>

<style>
	.language-dropdown {
		position: relative;
	}
</style>

