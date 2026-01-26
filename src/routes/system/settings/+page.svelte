<script lang="ts">
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
	import { goto } from '$app/navigation';
	import { Settings, Save, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-svelte';
	import {
		documentsApiGetOcrSettingsOptions,
		documentsApiUpdateOcrSettingsMutation
	} from '$lib/api/@tanstack/svelte-query.gen';

	const queryClient = useQueryClient();

	// Fetch current settings
	const settingsQuery = createQuery({
		...documentsApiGetOcrSettingsOptions()
	});

	// Update settings mutation
	const updateSettingsMutation = createMutation({
		...documentsApiUpdateOcrSettingsMutation(),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['settings'] });
			showSuccessMessage = true;
			setTimeout(() => {
				showSuccessMessage = false;
			}, 3000);
		}
	});

	let defaultModel = $state('');
	let defaultPrompt = $state('');
	let showSuccessMessage = $state(false);

	// Update form when data loads
	$effect(() => {
		if ($settingsQuery.data) {
			defaultModel = $settingsQuery.data.default_model || '';
			defaultPrompt = $settingsQuery.data.default_prompt || '';
		}
	});

	async function handleSave() {
		try {
			await $updateSettingsMutation.mutateAsync({
				body: {
					default_model: defaultModel.trim() || null,
					default_prompt: defaultPrompt.trim() || null,
					settings_json: null
				}
			});
		} catch (error) {
			console.error('Failed to update settings:', error);
		}
	}

	let hasChanges = $derived(
		$settingsQuery.data &&
		(defaultModel !== ($settingsQuery.data.default_model || '') ||
		defaultPrompt !== ($settingsQuery.data.default_prompt || ''))
	);
</script>

<svelte:head>
	<title>System Settings - Pagewise</title>
</svelte:head>

<div class="max-w-4xl mx-auto space-y-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center space-x-4">
			<button
				onclick={() => goto('/')}
				class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
				title="Back to home"
			>
				<ArrowLeft class="h-5 w-5 text-gray-600" />
			</button>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">System Settings</h1>
				<p class="mt-2 text-gray-600">
					Configure OCR presets and processing settings
				</p>
			</div>
		</div>
	</div>

	<!-- Quick Links to Preset Management -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
		<a
			href="/system/settings/docling-presets"
			class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
		>
			<div class="flex items-center space-x-4">
				<div class="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
					<Settings class="h-6 w-6 text-blue-600" />
				</div>
				<div>
					<h3 class="text-lg font-medium text-gray-900">Docling Presets</h3>
					<p class="text-sm text-gray-600 mt-1">
						Manage Docling OCR engine presets with advanced processing options
					</p>
				</div>
			</div>
		</a>

		<a
			href="/system/settings/ocr-presets"
			class="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow group"
		>
			<div class="flex items-center space-x-4">
				<div class="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
					<Settings class="h-6 w-6 text-green-600" />
				</div>
				<div>
					<h3 class="text-lg font-medium text-gray-900">OCRmyPDF Presets</h3>
					<p class="text-sm text-gray-600 mt-1">
						Manage OCRmyPDF engine presets for document optimization and OCR
					</p>
				</div>
			</div>
		</a>
	</div>

	{#if $settingsQuery.isLoading}
		<div class="bg-white rounded-lg border border-gray-200 p-12">
			<div class="flex items-center justify-center">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span class="ml-3 text-gray-600">Loading settings...</span>
			</div>
		</div>
	{:else if $settingsQuery.error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-6">
			<div class="flex items-start space-x-3">
				<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium text-red-900">Failed to load settings</p>
					<p class="text-sm text-red-700 mt-1">
						{$settingsQuery.error.message || 'An error occurred while loading settings'}
					</p>
				</div>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Settings Form -->
			<div class="lg:col-span-2 space-y-6">
				<div class="bg-white rounded-lg border border-gray-200 p-6">
					<div class="flex items-center space-x-3 mb-6">
						<Settings class="h-6 w-6 text-gray-600" />
						<h2 class="text-lg font-medium text-gray-900">DeepSeek OCR Configuration</h2>
					</div>

					<div class="space-y-6">
						<!-- Default Model -->
						<div>
							<label for="default_model" class="block text-sm font-medium text-gray-700 mb-1">
								Default Model
							</label>
							<input
								type="text"
								id="default_model"
								bind:value={defaultModel}
								placeholder="e.g., deepseek-reasoner"
								class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
							/>
							<p class="mt-1 text-sm text-gray-500">
								The default DeepSeek model to use for OCR processing. This can be overridden per upload.
							</p>
						</div>

						<!-- Default Prompt -->
						<div>
							<label for="default_prompt" class="block text-sm font-medium text-gray-700 mb-1">
								Default Prompt
							</label>
							<textarea
								id="default_prompt"
								bind:value={defaultPrompt}
								placeholder="Enter the default OCR prompt..."
								rows="8"
								class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
							></textarea>
							<p class="mt-1 text-sm text-gray-500">
								The default prompt template used for OCR processing. Leave empty to use the system default.
							</p>
						</div>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex justify-end space-x-4">
					<button
						onclick={() => goto('/')}
						class="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
					>
						Cancel
					</button>

					<button
						onclick={handleSave}
						disabled={!hasChanges || $updateSettingsMutation.isPending}
						class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
					>
						{#if $updateSettingsMutation.isPending}
							<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							<span>Saving...</span>
						{:else}
							<Save class="h-4 w-4" />
							<span>Save Settings</span>
						{/if}
					</button>
				</div>
			</div>

			<!-- Info Sidebar -->
			<div class="space-y-6">
				<div class="bg-white rounded-lg border border-gray-200 p-6">
					<h3 class="text-lg font-medium text-gray-900 mb-4">About OCR Settings</h3>

					<div class="space-y-4 text-sm">
						<div>
							<p class="font-medium text-gray-900 mb-1">DeepSeek OCR</p>
							<p class="text-gray-600">
								Pagewise uses DeepSeek's OCR capabilities to extract text from PDF pages with high accuracy.
							</p>
						</div>

						<div>
							<p class="font-medium text-gray-900 mb-1">Model Selection</p>
							<p class="text-gray-600">
								Choose the DeepSeek model that best fits your needs. Different models may offer varying levels of accuracy and speed.
							</p>
						</div>

						<div>
							<p class="font-medium text-gray-900 mb-1">Custom Prompts</p>
							<p class="text-gray-600">
								Define custom prompts to guide the OCR process for specific document types or formatting requirements.
							</p>
						</div>
					</div>
				</div>

				<div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div class="flex items-start space-x-3">
						<AlertCircle class="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
						<div class="text-sm">
							<p class="font-medium text-blue-900">Per-Upload Override</p>
							<p class="text-blue-700 mt-1">
								You can override these default settings when uploading individual documents by specifying a different model.
							</p>
						</div>
					</div>
				</div>

				{#if $settingsQuery.data}
					<div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
						<div class="text-sm">
							<p class="font-medium text-gray-900 mb-2">Settings Info</p>
							<div class="space-y-1 text-gray-600">
								<p><span class="font-medium">Created:</span> {new Date($settingsQuery.data.created_at).toLocaleDateString()}</p>
								<p><span class="font-medium">Updated:</span> {new Date($settingsQuery.data.updated_at).toLocaleDateString()}</p>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<!-- Success Message -->
{#if showSuccessMessage}
	<div class="fixed bottom-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg animate-fade-in">
		<div class="flex items-start space-x-3">
			<CheckCircle class="h-5 w-5 text-green-600 flex-shrink-0" />
			<div>
				<p class="font-medium text-green-900">Settings Saved</p>
				<p class="text-sm text-green-700 mt-1">
					Your OCR settings have been updated successfully
				</p>
			</div>
		</div>
	</div>
{/if}

<!-- Error Message -->
{#if $updateSettingsMutation.error}
	<div class="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
		<div class="flex items-start space-x-3">
			<AlertCircle class="h-5 w-5 text-red-600 flex-shrink-0" />
			<div>
				<p class="font-medium text-red-900">Failed to Save Settings</p>
				<p class="text-sm text-red-700 mt-1">
					{$updateSettingsMutation.error.message || 'An error occurred while saving settings'}
				</p>
			</div>
		</div>
	</div>
{/if}

