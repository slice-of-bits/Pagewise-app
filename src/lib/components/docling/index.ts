/**
 * Docling Editor Components
 *
 * A comprehensive suite of components for visualizing and editing
 * Docling JSON data in the Pagewise application.
 *
 * @module docling
 */

// Main Components
export { default as DoclingPageEditor } from './DoclingPageEditor.svelte';
export { default as DoclingBBoxViewer } from './DoclingBBoxViewer.svelte';
export { default as DoclingDataEditor } from './DoclingDataEditor.svelte';
export { default as DoclingColorLegend } from './DoclingColorLegend.svelte';

// Type Definitions
export type {
	BBox,
	DoclingBlock,
	DoclingData,
	PageMetadata,
	DoclingBlockType,
	DoclingBBoxViewerProps,
	DoclingDataEditorProps,
	DoclingPageEditorProps,
	DoclingColorLegendProps,
	BlockTypeColor
} from './types';

// Constants
export {
	BLOCK_TYPE_COLORS,
	DOCLING_BLOCK_TYPES
} from './types';

// Helper Functions
export {
	getBlockTypeColor,
	isValidBlockType,
	getDoclingDataFromMetadata,
	hasDoclingData,
	createEmptyBlock,
	isValidBBox,
	getBBoxDimensions,
	isPointInBBox
} from './types';
