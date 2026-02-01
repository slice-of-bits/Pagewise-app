<script lang="ts">
    import {createMutation, useQueryClient} from '@tanstack/svelte-query';
    import {documentsApiUpdatePageMutation} from '$lib/api/@tanstack/svelte-query.gen';
    import DoclingBBoxViewer from './DoclingBBoxViewer.svelte';
    import DoclingDataEditor from './DoclingDataEditor.svelte';
    import DoclingColorLegend from './DoclingColorLegend.svelte';
    import {Save, AlertCircle, Eye, EyeOff, Check, Info, RotateCcw, X} from 'lucide-svelte';
    import {beforeNavigate} from '$app/navigation';
    import {DoclingStateManager, type SimplifiedBlock} from './DoclingStateManager';
    import type {PageDetailsSchema} from '$lib/api/types.gen';
    import {onMount} from 'svelte';

    interface BBox {
        l: number;
        t: number;
        r: number;
        b: number;
    }

    interface DoclingBlock {
        type: string;
        text?: string;
        bbox?: BBox;
        [key: string]: any;
    }

    interface Props {
        page: PageDetailsSchema;
        onClose?: () => void;
    }

    let {page, onClose}: Props = $props();

    let selectedBlockIndex = $state<number | null>(null);
    let showLabels = $state(true);
    let showLegend = $state(false);
    let isSaving = $state(false);
    let saveError = $state<string | null>(null);
    let saveSuccess = $state(false);
    let isAddingBlock = $state(false);

    // State manager instance
    let stateManager: DoclingStateManager | null = $state(null);
    let simplifiedBlocks = $state<SimplifiedBlock[]>([]);
    let bboxBlocks = $state<DoclingBlock[]>([]);
    let blocksModified = $state(false);
    let initializedPageSqid = $state<string | null>(null);
    let blocksUpdateTrigger = $state(0); // Force reactivity trigger

    const queryClient = useQueryClient();

    // Available block types from Docling
    const blockTypes = [
        'text',
        'section_header',
        'title',
        'heading',
        'paragraph',
        'list',
        'list_item',
        'table',
        'figure',
        'picture',
        'caption',
        'formula',
        'footnote',
        'page_header',
        'page_footer',
        'code'
    ];

    // Update page mutation
    const updatePageMutation = createMutation({
        ...documentsApiUpdatePageMutation(),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['documentsApiGetPage']});
            if (stateManager) {
                stateManager.markAsSaved();
            }
            saveSuccess = true;
            setTimeout(() => {
                saveSuccess = false;
            }, 3000);
        },
        onError: (error: any) => {
            saveError = error?.message || 'Failed to save changes';
            setTimeout(() => {
                saveError = null;
            }, 5000);
        }
    });

    // Initialize state manager when page data loads
    onMount(() => {
        initializeEditor();
    });

    // Re-initialize if page changes
    $effect(() => {
        if (page?.sqid && page.sqid !== initializedPageSqid) {
            initializeEditor();
        }
    });

    function initializeEditor() {
        if (!page || (!page.docling_json && !page.docling_json_override)) {
            return;
        }

        // Prevent re-initialization of the same page
        if (initializedPageSqid === page.sqid) {
            return;
        }

        initializedPageSqid = page.sqid;

        console.log('DoclingPageEditor: Initializing with page data', {
            sqid: page.sqid,
            page_number: page.page_number,
            has_page_image: !!page.page_image,
            page_image_url: page.page_image,
            has_docling_json: !!page.docling_json,
            has_docling_json_override: !!page.docling_json_override,
            docling_keys: page.docling_json ? Object.keys(page.docling_json) : [],
            override_keys: page.docling_json_override ? Object.keys(page.docling_json_override) : []
        });

        try {
            stateManager = new DoclingStateManager(page);
            const newSimplifiedBlocks = stateManager.getSimplifiedBlocks();

            console.log('DoclingPageEditor: State manager created', {
                simplifiedBlocksCount: newSimplifiedBlocks.length,
                stateManagerExists: !!stateManager
            });

            simplifiedBlocks = newSimplifiedBlocks;

            // Convert simplified blocks to format expected by BBoxViewer/Editor
            bboxBlocks = newSimplifiedBlocks.map(block => {
                const {type, text, bbox, ...rest} = block.originalData || {};
                return {
                    ...rest,
                    type: block.type,
                    text: block.text,
                    bbox: block.bbox || undefined
                };
            });
            blocksModified = false;

            console.log('DoclingPageEditor: Simplified blocks created', {
                count: newSimplifiedBlocks.length,
                bboxBlocksCount: bboxBlocks.length,
                types: [...new Set(newSimplifiedBlocks.map(b => b.type))],
                sampleBlock: bboxBlocks[0]
            });
        } catch (error) {
            console.error('DoclingPageEditor: Error initializing state manager', error);
        }
    }

    const hasUnsavedChanges = $derived(blocksModified || (stateManager && stateManager.hasUnsavedChanges ? stateManager.hasUnsavedChanges() : false));

    function handleBlocksChange() {
        // Mark as modified when blocks change
        blocksModified = true;
        blocksUpdateTrigger++;
    }

    function handleNewBBox(bbox: BBox) {
        // Create new block with the drawn bbox
        const blockType = 'text';
        const newBlock = {
            type: blockType,
            text: '',
            bbox: bbox
        };
        bboxBlocks = [...bboxBlocks, newBlock];
        selectedBlockIndex = bboxBlocks.length - 1;
        blocksModified = true;
        isAddingBlock = false;
        handleBlocksChange();
    }

    function handleBBoxUpdate(index: number, bbox: BBox) {
        // Update bbox for the block at index
        const newBlocks = [...bboxBlocks];
        newBlocks[index] = { ...newBlocks[index], bbox };
        bboxBlocks = newBlocks;
        blocksModified = true;
        handleBlocksChange();
    }

    function startAddingBlock() {
        isAddingBlock = true;
    }

    async function handleSave() {
        if (!stateManager || !hasUnsavedChanges) return;

        isSaving = true;
        saveError = null;

        try {
            const doclingData = stateManager.getCurrentDocling();

            await $updatePageMutation.mutateAsync({
                path: {
                    sqid: page.sqid
                },
                body: {
                    docling_json_override: doclingData
                } as any
            });
        } catch (e: any) {
            console.error('Save failed:', e);
            saveError = e?.message || 'Failed to save changes';
        } finally {
            isSaving = false;
        }
    }

    function handleReset() {
        if (!stateManager) return;

        if (confirm('Are you sure you want to discard all changes?')) {
            stateManager.reset();
            simplifiedBlocks = stateManager.getSimplifiedBlocks();

            // Recreate bboxBlocks from reset simplifiedBlocks
            bboxBlocks = simplifiedBlocks.map(block => {
                const {type, text, bbox, ...rest} = block.originalData || {};
                return {
                    ...rest,
                    type: block.type,
                    text: block.text,
                    bbox: block.bbox || undefined
                };
            });
            blocksModified = false;
        }
    }

    function handleClose() {
        if (hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
                return;
            }
        }
        onClose?.();
    }

    // Warn before navigating away with unsaved changes
    beforeNavigate(({cancel}) => {
        if (hasUnsavedChanges) {
            if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
                cancel();
            }
        }
    });

    // Keyboard shortcut for save (Ctrl+S or Cmd+S)
    function handleKeydown(event: KeyboardEvent) {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            if (hasUnsavedChanges && !isSaving) {
                handleSave();
            }
        }
    }
</script>

<svelte:window onkeydown={handleKeydown}/>

<div class="flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <div class="flex items-center space-x-4">
            <h2 class="text-xl font-semibold text-gray-900">Edit Docling Data</h2>
            <span class="text-sm text-gray-500">
				Page {page.page_number}
			</span>
        </div>

        <div class="flex items-center space-x-3">

            <!-- Toggle Labels -->
            <button
                    onclick={() => (showLabels = !showLabels)}
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                    title={showLabels ? 'Hide labels' : 'Show labels'}
            >
                {#if showLabels}
                    <EyeOff class="h-4 w-4"/>
                    <span>Hide Labels</span>
                {:else}
                    <Eye class="h-4 w-4"/>
                    <span>Show Labels</span>
                {/if}
            </button>

            <!-- Toggle Legend -->
            <button
                    onclick={() => (showLegend = !showLegend)}
                    class="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                    title="Show color legend"
            >
                <Info class="h-4 w-4"/>
                <span>Legend</span>
            </button>

            <!-- Save Button -->
            <button
                    onclick={handleSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm font-medium"
            >
                {#if isSaving}
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                {:else if saveSuccess}
                    <Check class="h-4 w-4"/>
                    <span>Saved!</span>
                {:else}
                    <Save class="h-4 w-4"/>
                    <span>Save Changes</span>
                {/if}
            </button>
        </div>
    </div>

    <!-- Status Messages -->
    {#if saveError}
        <div class="px-6 py-3 bg-red-50 border-b border-red-200">
            <div class="flex items-center space-x-2 text-red-800">
                <AlertCircle class="h-4 w-4"/>
                <span class="text-sm">{saveError}</span>
            </div>
        </div>
    {/if}

    {#if hasUnsavedChanges && !saveSuccess}
        <div class="px-6 py-2 bg-amber-50 border-b border-amber-200">
            <p class="text-sm text-amber-800">
                You have unsaved changes. Press <kbd
                    class="px-1.5 py-0.5 bg-amber-100 rounded text-xs font-mono">Ctrl+S</kbd> to save.
            </p>
        </div>
    {/if}

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">

        <!-- Viewer (Left) -->
        <div class="flex-1 border-r border-gray-200 overflow-hidden relative">
            {#if page.page_image}
                <DoclingBBoxViewer
                        {page}
                        blocks={bboxBlocks}
                        bind:selectedBlockIndex
                        bind:showLabels
                        bind:isAddingBlock
                        updateTrigger={blocksUpdateTrigger}
                        onBBoxDrawn={handleNewBBox}
                        onBBoxUpdate={handleBBoxUpdate}
                />
            {:else}
                <div class="flex items-center justify-center h-full bg-gray-50">
                    <div class="text-center text-gray-500">
                        <AlertCircle class="h-12 w-12 mx-auto mb-4 text-gray-400"/>
                        <p>No page image available</p>
                        <p class="text-sm mt-2">Cannot display bounding boxes without an image</p>
                    </div>
                </div>
            {/if}

            <!-- Color Legend Overlay -->
            <DoclingColorLegend
                    bind:show={showLegend}
                    onClose={() => showLegend = false}
            />
        </div>

        <!-- Editor (Right) -->
        <div class="w-96 overflow-hidden">
            <DoclingDataEditor
                    bind:blocks={bboxBlocks}
                    bind:selectedBlockIndex
                    {blockTypes}
                    {isAddingBlock}
                    onBlocksChange={handleBlocksChange}
                    onBlockSelect={(index) => (selectedBlockIndex = index)}
                    onAddBlock={startAddingBlock}
            />
        </div>

    </div>
</div>

<style>
    kbd {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
</style>
