/**
 * DoclingStateManager - Manages Docling JSON data state and transformations
 *
 * Handles the complex Docling JSON structure and provides a simpler block-based interface
 * for the editor components.
 */

import type { PageDetailsSchema } from '$lib/api/types.gen';

export interface BBox {
    l: number;
    t: number;
    r: number;
    b: number;
    coord_origin?: string;
}

export interface DoclingProv {
    bbox: BBox;
    page_no: number;
    charspan?: [number, number];
}

export interface DoclingBlock {
    // Core properties
    type: string;  // Corresponds to 'label' in docling JSON
    text?: string;
    orig?: string;

    // Position and reference
    prov?: DoclingProv[];
    self_ref?: string;
    parent?: { $ref: string };

    // Content structure
    children?: Array<{ $ref: string }>;
    content_layer?: string;

    // Type-specific properties
    label?: string;
    level?: number;
    marker?: string;
    enumerated?: boolean;
    image?: any;
    captions?: any[];
    footnotes?: any[];
    references?: any[];
    annotations?: any[];

    // Additional properties
    [key: string]: any;
}

export interface DoclingJSON {
    body?: {
        name: string;
        label: string;
        children: Array<{ $ref: string }>;
        self_ref: string;
        content_layer: string;
    };
    name?: string;
    pages?: {
        [key: string]: {
            size: { width: number; height: number };
            page_no: number;
        };
    };
    texts?: DoclingBlock[];
    groups?: DoclingBlock[];
    pictures?: DoclingBlock[];
    tables?: DoclingBlock[];
    form_items?: DoclingBlock[];
    key_value_items?: DoclingBlock[];
    furniture?: {
        name: string;
        label: string;
        children: Array<{ $ref: string }>;
        self_ref: string;
        content_layer: string;
    };
    origin?: {
        filename: string;
        mimetype: string;
        binary_hash: number;
    };
    version?: string;
    schema_name?: string;
}

export interface SimplifiedBlock {
    id: string;
    type: string;
    text: string;
    bbox: BBox | null;
    page_no: number;
    originalRef: string;
    category: 'text' | 'group' | 'picture' | 'table' | 'form_item' | 'key_value_item';
    originalData: DoclingBlock;
}

/**
 * Manages the state of Docling JSON data
 */
export class DoclingStateManager {
    private originalDocling: DoclingJSON | null = null;
    private currentDocling: DoclingJSON | null = null;
    private hasChanges: boolean = false;

    constructor(page: PageDetailsSchema) {
        // Load from override if available, otherwise from original
        const doclingData = page.docling_json_override || page.docling_json;

        if (doclingData) {
            this.originalDocling = JSON.parse(JSON.stringify(doclingData)) as DoclingJSON;
            this.currentDocling = JSON.parse(JSON.stringify(doclingData)) as DoclingJSON;
        }
    }

    /**
     * Get all blocks as a simplified, flat array
     */
    getSimplifiedBlocks(): SimplifiedBlock[] {
        if (!this.currentDocling) {
            console.warn('DoclingStateManager: No currentDocling data');
            return [];
        }

        const blocks: SimplifiedBlock[] = [];

        console.log('DoclingStateManager: Starting block simplification', {
            hasCurrentDocling: !!this.currentDocling,
            textsLength: this.currentDocling.texts?.length || 0,
            groupsLength: this.currentDocling.groups?.length || 0,
            picturesLength: this.currentDocling.pictures?.length || 0,
            tablesLength: this.currentDocling.tables?.length || 0
        });

        // Process texts
        if (this.currentDocling.texts) {
            console.log('DoclingStateManager: Processing texts', this.currentDocling.texts.length);
            this.currentDocling.texts.forEach((text, index) => {
                const simplified = this.simplifyBlock(text, index, 'text');
                console.log(`Text ${index}:`, {
                    type: simplified.type,
                    text: simplified.text?.substring(0, 50),
                    hasBbox: !!simplified.bbox
                });
                blocks.push(simplified);
            });
        }

        // Process groups
        if (this.currentDocling.groups) {
            console.log('DoclingStateManager: Processing groups', this.currentDocling.groups.length);
            this.currentDocling.groups.forEach((group, index) => {
                blocks.push(this.simplifyBlock(group, index, 'group'));
            });
        }

        // Process pictures
        if (this.currentDocling.pictures) {
            console.log('DoclingStateManager: Processing pictures', this.currentDocling.pictures.length);
            this.currentDocling.pictures.forEach((picture, index) => {
                blocks.push(this.simplifyBlock(picture, index, 'picture'));
            });
        }

        // Process tables
        if (this.currentDocling.tables) {
            console.log('DoclingStateManager: Processing tables', this.currentDocling.tables.length);
            this.currentDocling.tables.forEach((table, index) => {
                blocks.push(this.simplifyBlock(table, index, 'table'));
            });
        }

        console.log('DoclingStateManager: Block simplification complete', {
            totalBlocks: blocks.length,
            blockTypes: blocks.map(b => b.type)
        });

        return blocks;
    }

    /**
     * Convert a Docling block to a simplified format
     */
    private simplifyBlock(
        block: DoclingBlock,
        index: number,
        category: SimplifiedBlock['category']
    ): SimplifiedBlock {
        const bbox = block.prov?.[0]?.bbox || null;
        const page_no = block.prov?.[0]?.page_no || 1;

        return {
            id: block.self_ref || `#/${category}/${index}`,
            type: block.label || block.name || 'unknown',
            text: block.text || block.orig || '',
            bbox: bbox,
            page_no: page_no,
            originalRef: block.self_ref || '',
            category: category,
            originalData: block
        };
    }

    /**
     * Update a specific block
     */
    updateBlock(blockId: string, updates: Partial<SimplifiedBlock>): void {
        if (!this.currentDocling) return;

        const categories: Array<keyof DoclingJSON> = ['texts', 'groups', 'pictures', 'tables'];

        for (const category of categories) {
            const blocks = this.currentDocling[category] as DoclingBlock[] | undefined;
            if (!blocks) continue;

            const index = blocks.findIndex(b => b.self_ref === blockId);
            if (index !== -1) {
                const block = blocks[index];

                // Update text
                if (updates.text !== undefined) {
                    block.text = updates.text;
                    block.orig = updates.text;
                }

                // Update label/type
                if (updates.type !== undefined) {
                    block.label = updates.type;
                }

                // Update bbox
                if (updates.bbox && block.prov?.[0]) {
                    block.prov[0].bbox = updates.bbox;
                }

                this.hasChanges = true;
                break;
            }
        }
    }

    /**
     * Delete a block
     */
    deleteBlock(blockId: string): void {
        if (!this.currentDocling) return;

        const categories: Array<keyof DoclingJSON> = ['texts', 'groups', 'pictures', 'tables'];

        for (const category of categories) {
            const blocks = this.currentDocling[category] as DoclingBlock[] | undefined;
            if (!blocks) continue;

            const index = blocks.findIndex(b => b.self_ref === blockId);
            if (index !== -1) {
                blocks.splice(index, 1);
                this.hasChanges = true;

                // TODO: Remove references from parent and body
                break;
            }
        }
    }

    /**
     * Add a new block
     */
    addBlock(category: SimplifiedBlock['category'], block: Partial<SimplifiedBlock>): void {
        if (!this.currentDocling) return;

        const blocks = this.currentDocling[`${category}s`] as DoclingBlock[] | undefined;
        if (!blocks) return;

        const index = blocks.length;
        const self_ref = `#/${category}s/${index}`;

        const newBlock: DoclingBlock = {
            type: block.type || 'text',
            text: block.text || '',
            orig: block.text || '',
            label: block.type || 'text',
            self_ref: self_ref,
            parent: { $ref: '#/body' },
            children: [],
            content_layer: 'body',
            prov: block.bbox ? [{
                bbox: block.bbox,
                page_no: block.page_no || 1,
                charspan: [0, (block.text || '').length]
            }] : []
        };

        blocks.push(newBlock);
        this.hasChanges = true;
    }

    /**
     * Get the current Docling JSON
     */
    getCurrentDocling(): DoclingJSON | null {
        return this.currentDocling;
    }

    /**
     * Check if there are unsaved changes
     */
    hasUnsavedChanges(): boolean {
        return this.hasChanges;
    }

    /**
     * Reset to original state
     */
    reset(): void {
        if (this.originalDocling) {
            this.currentDocling = JSON.parse(JSON.stringify(this.originalDocling));
            this.hasChanges = false;
        }
    }

    /**
     * Mark as saved (resets the change flag)
     */
    markAsSaved(): void {
        this.hasChanges = false;
        if (this.currentDocling) {
            this.originalDocling = JSON.parse(JSON.stringify(this.currentDocling));
        }
    }
}
