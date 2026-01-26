/**
 * Type definitions for Docling Editor components
 *
 * This file provides TypeScript interfaces for working with Docling data
 * in the Pagewise application.
 */

/**
 * Bounding box coordinates
 * Represents a rectangular area on a page image
 */
export interface BBox {
	/** Left edge X coordinate */
	l: number;
	/** Top edge Y coordinate */
	t: number;
	/** Right edge X coordinate */
	r: number;
	/** Bottom edge Y coordinate */
	b: number;
}

/**
 * A single content block from Docling processing
 * Each block represents a semantic unit of content (paragraph, title, etc.)
 */
export interface DoclingBlock {
	/** Type of content block (text, title, heading, paragraph, etc.) */
	type: string;
	/** Text content of the block */
	text?: string;
	/** Bounding box coordinates */
	bbox?: BBox;
	/** Additional properties from Docling */
	[key: string]: any;
}

/**
 * Complete Docling data structure
 * Contains all blocks and metadata from Docling processing
 */
export interface DoclingData {
	/** Array of content blocks */
	blocks?: DoclingBlock[];
	/** Additional Docling metadata */
	[key: string]: any;
}

/**
 * Page metadata structure
 * Extends the API PageDetailsSchema with Docling-specific fields
 */
export interface PageMetadata {
	/** Original Docling processing output (read-only) */
	docling_json?: DoclingData;
	/** User edits and overrides (saved by editor) */
	docling_json_override?: DoclingData;
	/** Other metadata fields */
	[key: string]: any;
}

/**
 * Available Docling block types
 */
export type DoclingBlockType =
	| 'text'
	| 'title'
	| 'heading'
	| 'paragraph'
	| 'list'
	| 'table'
	| 'figure'
	| 'caption'
	| 'formula'
	| 'footnote'
	| 'page_header'
	| 'page_footer'
	| 'code';

/**
 * Props for DoclingBBoxViewer component
 */
export interface DoclingBBoxViewerProps {
	/** URL of the page image to display */
	imageUrl: string;
	/** Array of blocks to render as bounding boxes */
	blocks: DoclingBlock[];
	/** Index of currently selected block (bindable) */
	selectedBlockIndex?: number | null;
	/** Whether to show block labels (bindable) */
	showLabels?: boolean;
	/** Callback when a block is clicked */
	onBlockClick?: (index: number) => void;
}

/**
 * Props for DoclingDataEditor component
 */
export interface DoclingDataEditorProps {
	/** Array of blocks to edit (bindable) */
	blocks: DoclingBlock[];
	/** Index of currently selected block (bindable) */
	selectedBlockIndex?: number | null;
	/** Available block types for dropdown */
	blockTypes: string[];
	/** Callback when blocks are modified */
	onBlocksChange: (blocks: DoclingBlock[]) => void;
	/** Callback when a block is selected */
	onBlockSelect?: (index: number) => void;
}

/**
 * Props for DoclingPageEditor component
 */
export interface DoclingPageEditorProps {
	/** SQID of the page to edit */
	pageSqid: string;
	/** Callback when editor is closed */
	onClose?: () => void;
}

/**
 * Props for DoclingColorLegend component
 */
export interface DoclingColorLegendProps {
	/** Whether to show the legend (bindable) */
	show?: boolean;
	/** Callback when legend is closed */
	onClose?: () => void;
}

/**
 * Color mapping for block types
 */
export interface BlockTypeColor {
	type: DoclingBlockType;
	color: string;
	label: string;
}

/**
 * Default color map for all block types
 */
export const BLOCK_TYPE_COLORS: Record<string, string> = {
	text: '#3B82F6',
	title: '#8B5CF6',
	heading: '#6366F1',
	paragraph: '#3B82F6',
	list: '#10B981',
	table: '#F59E0B',
	figure: '#EC4899',
	caption: '#14B8A6',
	formula: '#F97316',
	footnote: '#6B7280',
	page_header: '#84CC16',
	page_footer: '#06B6D4',
	code: '#EF4444',
	default: '#64748B'
};

/**
 * Available block types as a constant array
 */
export const DOCLING_BLOCK_TYPES: DoclingBlockType[] = [
	'text',
	'title',
	'heading',
	'paragraph',
	'list',
	'table',
	'figure',
	'caption',
	'formula',
	'footnote',
	'page_header',
	'page_footer',
	'code'
];

/**
 * Helper function to get color for a block type
 * @param type - Block type
 * @returns Hex color code
 */
export function getBlockTypeColor(type: string): string {
	return BLOCK_TYPE_COLORS[type.toLowerCase()] || BLOCK_TYPE_COLORS.default;
}

/**
 * Helper function to validate if a string is a valid block type
 * @param type - Type to validate
 * @returns True if valid block type
 */
export function isValidBlockType(type: string): type is DoclingBlockType {
	return DOCLING_BLOCK_TYPES.includes(type as DoclingBlockType);
}

/**
 * Helper function to extract Docling data from page object
 * Checks both top-level fields and metadata for compatibility
 * @param page - Page object (PageDetailsSchema) or metadata
 * @returns Docling data or null if not found
 */
export function getDoclingDataFromMetadata(page: any): DoclingData | null {
	if (!page) return null;

	// First, check top-level fields (per PageDetailsSchema)
	if (page.docling_json_override) {
		return page.docling_json_override;
	}
	if (page.docling_json) {
		return page.docling_json;
	}

	// Fallback: check in metadata (for backward compatibility or nested structure)
	const metadata = page.metadata;
	if (metadata) {
		if (metadata.docling_json_override) {
			return metadata.docling_json_override;
		}
		if (metadata.docling_json) {
			return metadata.docling_json;
		}
	}

	return null;
}

/**
 * Helper function to check if metadata has Docling data
 * @param metadata - Page metadata object
 * @returns True if Docling data exists
 */
export function hasDoclingData(metadata: PageMetadata | null | undefined): boolean {
	return getDoclingDataFromMetadata(metadata) !== null;
}

/**
 * Helper function to create a new empty block
 * @param type - Block type (defaults to 'text')
 * @returns New DoclingBlock
 */
export function createEmptyBlock(type: DoclingBlockType = 'text'): DoclingBlock {
	return {
		type,
		text: '',
		bbox: { l: 0, t: 0, r: 100, b: 100 }
	};
}

/**
 * Helper function to validate bbox coordinates
 * @param bbox - Bounding box to validate
 * @returns True if valid
 */
export function isValidBBox(bbox: BBox): boolean {
	return (
		typeof bbox.l === 'number' &&
		typeof bbox.t === 'number' &&
		typeof bbox.r === 'number' &&
		typeof bbox.b === 'number' &&
		bbox.l < bbox.r &&
		bbox.t < bbox.b
	);
}

/**
 * Helper function to calculate bbox dimensions
 * @param bbox - Bounding box
 * @returns Object with width and height
 */
export function getBBoxDimensions(bbox: BBox): { width: number; height: number } {
	return {
		width: bbox.r - bbox.l,
		height: bbox.b - bbox.t
	};
}

/**
 * Helper function to check if a point is inside a bbox
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param bbox - Bounding box
 * @returns True if point is inside bbox
 */
export function isPointInBBox(x: number, y: number, bbox: BBox): boolean {
	return x >= bbox.l && x <= bbox.r && y >= bbox.t && y <= bbox.b;
}
