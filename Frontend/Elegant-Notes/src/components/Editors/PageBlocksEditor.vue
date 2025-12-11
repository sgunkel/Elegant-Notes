<script>
/**
 * Blocks collection editor for Page objects. This is reusable for whole Page objects and
 *     backlinks for embedded editing. This contains the logic for manipulating the list
 *     of Block objects, including indentions and deletes. Since this component is
 *     designed to be reused in multiple places, we use the `store` object for tracking
 *     which Block item has focus globally.
 */

import { store } from '@/store.js'

import BlockEditor from './BlockEditor.vue';

import { createDebounce } from '@/helpers/debouncer.js';
import { blockUtilities } from '@/helpers/blockUtilities.js';
import { editorConstants } from '@/constants/editorConstants.js';

export default {
    props: {
        rootLevelBlocks: Array,
    },
    emits: [
        'update-document',
        'update-root-level',
    ],
    components: {
        BlockEditor,
    },
    data() {
        return {
            store,
            blockRefocusKey: 0, // Easy way to update the root level editors after an action
        }
    },
    setup() {
        return {
            debounce: createDebounce(),
        };
    },
    methods: {
        refreshEditors() {
            this.blockRefocusKey++
        },
        updateDocument() {
            this.$emit('update-document', this.rootLevelBlocks)
        },

        ///
        /// Block Editor Handlers
        ///

        handleUpdate(updatedBlock, keepFocus) {
            if (keepFocus !== undefined && !keepFocus) { // idk how, but keepFocus can be randomly undefined even though I've checked everything and have confirmed that it should be a boolean value
                store.editingId = null
            }
            
            blockUtilities.updateRecursive(this.rootLevelBlocks, updatedBlock)
            this.debounce(this.updateDocument, editorConstants.pageUpdateDebounceDelayMS)
        },
        changeEditIDByOffset(offset) {
            // Flatten root level objects to an array, get the index of the focused Block,
            //     and change the ID based on the offset.
            const flatList = blockUtilities.flattenBlocks(this.rootLevelBlocks)
            const currentIndex = flatList.findIndex(b => b.id === store.editingId)
            if (currentIndex === -1) { return }

            const targetIndex = currentIndex + offset
            if (flatList[targetIndex]) {
                store.editingId = flatList[targetIndex].id
            }
            this.refreshEditors()
        },
        createBlockAfter(targetId) {
            const newBlock = blockUtilities.createNewBlock()
            const blocksCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.insertAfterRecursive(blocksCopy, newBlock, targetId)) {
                this.$emit('update-root-level', blocksCopy)
                store.editingId = newBlock.id // Automatically focuses the BaseEditor belonging to `newBlock`
            }
        },
        deleteBlock(blockID) {
            // TODO this won't update the document correctly
            const copy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.deleteByID(copy, blockID)) {
                this.$emit('update-root-level', copy)
                // The Block that was deleted already handled shifting focus to the next block
            }
        },
        indentBlock(blockId, newContent) {
            const copy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.indent(blockId, copy, newContent, this.onBlockIndentUpdate, this.onBlockIndentEditIDChange)) {
                this.$emit('update-root-level', copy)
                this.refreshEditors()
            }
        },
        outdentBlock(blockId, newText) {
            const blocksCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            let [success, movedBlock, copy] = blockUtilities.outdentRecursive(blocksCopy, blockId, newText) // we'll update this later (I seriously cannot look at it without dying inside right)
            if (success) {
                this.$emit('update-root-level', copy)
                this.handleUpdate(movedBlock, true);
                store.editingId = blockId;
                this.refreshEditors()
            }
        },
        focusBlockAbove() {
            this.changeEditIDByOffset(-1)
        },
        focusBlockBelow() {
            this.changeEditIDByOffset(1)
        },

        ///
        /// Handlers
        ///

        handleEditRequest(objID) {
            store.pendingFocusId = objID
            store.editingId = objID
            this.refreshEditors()
        },
        handleBlurRequest(objID) {
            if (store.pendingFocusId === objID && objID != store.getPage().id) {
                return // skip if this block is about to focus again

                // Note that Vue has some weird timing issues with how an <input>'s @blur
                //     and @click works - when a BaseEditor component has focus and the
                //     user selects another one, the original component's @blur fires
                //     *before* the new one's @click.
                // Also, this messes with firing the Page Rename dialog, so we ignore that.
                //
                // This is handled at the highest level (this file) to keep BaseEditor
                //     small and simple :)
            }

            if (store.editingId === objID) {
                store.editingId = undefined // another object requested focus, and the previous object's `blur` signal fired afterward
            }
            this.refreshEditors()
        },

        //
        // Callbacks
        //
        onBlockIndentUpdate(indentedBlock, wasSuccessful) {
            this.handleUpdate(indentedBlock, wasSuccessful)
        },
        onBlockIndentEditIDChange(newID) {
            store.editingId = newID
        },
    }
}
</script>

<template>
    <div class="pbe-content-wrapper">
        <BlockEditor
            v-for="block in rootLevelBlocks"
            :block-obj="block"
            :indention-level="0"
            :editingID="store.editingId"
            :refocus-key="blockRefocusKey"
            :key="blockRefocusKey"
            @request-indent="indentBlock"
            @request-outdent="outdentBlock"
            @request-blur="handleBlurRequest"
            @request-focus="handleEditRequest"
            @request-block-update="handleUpdate"
            @request-navigate-up="focusBlockAbove"
            @request-navigate-down="focusBlockBelow"
            @request-create-block="createBlockAfter"
            @request-delete-block="deleteBlock"
        />
    </div>
</template>

<style>
.pbe-content-wrapper {
    display: flex;
    flex-direction: column;
    overflow: auto;
    width: 100%;
    height: 100%;
}
</style>
