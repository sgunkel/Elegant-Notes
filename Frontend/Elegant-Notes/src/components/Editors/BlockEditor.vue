<script>
/**
 * Block editor with Markdown display.
 */

import { nextTick } from 'vue';
import BaseEditor from './BaseEditor.vue';
import BlockReferenceSelectionDialog from '../Dialogs/BlockReferenceSelectionDialog.vue';
import md from '@/helpers/MarkdownJSONUtils.js'
import { metaOperations } from '@/helpers/metaFetchers';
import { textUtil } from '@/helpers/textUtil';
import { notificationUtils } from '@/helpers/notifications';

export default {
    components: {
        BaseEditor,
        BlockReferenceSelectionDialog,
    },
    props: {
        blockObj: Object,
        editingID: String,
        indentionLevel: Number,
        refocusKey: Number,
    },
    emits: [
        'request-blur',
        'request-focus',
        'request-indent',
        'request-outdent',
        'request-block-update',
        'request-delete-block',
        'request-create-block',
        'request-navigate-up',
        'request-navigate-down',
        'referenced-new-block', // Use case: user links to Block in the same Page object and the newly referenced block needs to know - or else we will overwrite the temporary ID it was given when we save
    ],
    data() {
        return {
            editableContent: this.blockObj.content,
            inputTagRect: null, // Used for positioning the search results when looking up references
            refList: [], // Filled with Page and Block objects when searching for the respective object
            showRefSelectionDialog: false,
            showRefList: false, // The references a Block has (the number on the right side of the editor) and whether to show the dialog for it or not
            refObjType: null, // Type of object - Page or Block - being searched when the user is typing between `((`/`[[` pairs
        }
    },
    computed: {
        isEditing() {
            return this.blockObj.id === this.editingID
        },
    },
    methods: {
        MarkdownToHTML(content) {
            return md.render(content)
        },

        ///
        /// Handlers
        ///

        handleBlockUpdate(newText) {
            this.updateReferenceSelectionDialogPosition()
            console.log(new Date().toLocaleString(), 'block update', this.blockObj.id, newText)
            this.editableContent = newText
            const newBlock = {
                ...this.blockObj,
                content: newText,
            }
            this.relayBlockUpdate(newBlock, this.isEditing)
        },
        handleBlurRequest() {
            this.showRefSelectionDialog = false
            this.relayBlurRequest(this.blockObj.id, this.editableContent)
        },
        handleIndentRequest() {
            this.relayIndentRequest(this.blockObj.id, this.editableContent)
        },
        handleOutdentRequest() {
            this.relayOutdentRequest(this.blockObj.id, this.editableContent)
        },
        handleNavigateUpRequest() {
            this.relayNavigateUpRequest()
        },
        handleNavigateDownRequest() {
            this.relayNavigateDownRequest()
        },
        handleFocusRequest() {
            this.updateReferenceSelectionDialogPosition()
            this.relayFocusRequest(this.blockObj.id)
        },
        handleBlockDeleteRequest() {
            // Deleting an object with children also deletes the children - so don't do it!
            if (this.blockObj.children.length === 0) {
                this.handleNavigateDownRequest() // Focus the next Block
                // TODO do we want to focus the Block below or above us?

                this.relayBlockDeleteRequest(this.blockObj.id)
            }
        },
        handleNewBlockRequest() {
            this.relayNewBlockRequest(this.blockObj.id)
        },
        handleOpenReferenceSelectionDialog(trigger, event) {
            this.refObjType = trigger
            this.showRefSelectionDialog = true
            console.log('handling open ref selection')

            const query = textUtil.extractPageReferenceQuery(event.target.value)
            if (query && trigger === 'Page') {
                metaOperations.searchPagesByName(query, this.handlePageNameQuerySuccess, this.handlePageNameQueryFailure)
            }
            else if (query && trigger === 'Block') {
                console.log('search blocks')
                metaOperations.searchBlocksByText(query, this.handleBlockQuerySuccess, this.handleBlockQueryFailure)
            }
        },
        handleCloseReferenceSelectionDialog() {
            this.showRefSelectionDialog = false
            this.refObjType = null
        },
        handleReferenceSelected(reference) {
            const input = this.$refs.baseEditor.getInputElement()
            const cursorPosition = input.selectionStart
            console.log('ref.id:', reference.actual.block_id, 'this.block.id:', this.blockObj.id)
            if (!reference.id) {
                this.handleBlockNewlyReferencedBlock(reference.actual.page_name, reference)
            }
            console.log('ref.id:', reference.actual.block_id, 'this.block.id:', this.blockObj.id)
            const updates = textUtil.replaceSearchQueryWithReference(this.editableContent, reference, cursorPosition, this.refObjType)
            this.handleBlockUpdate(updates.text)
            nextTick(() => input.setSelectionRange(updates.cursor, updates.cursor))

            this.handleCloseReferenceSelectionDialog()
        },
        handleBlockNewlyReferencedBlock(pageName, reference) {
            this.relayNewlyReferencedBlock(pageName, reference)
        },
        handlePageNameQuerySuccess(pages) {
            this.refList = pages.map(x => {
                const name = x.replace('/pages/', '').replace('.md', '')
                return {
                    id: name,
                    text: name,
                    actual: x,
                }
            })
        },
        handlePageNameQueryFailure(msg) {
            notificationUtils.toastError('Something when wrong when searching Pages - check console log')
            console.log(msg)
        },
        handleBlockQuerySuccess(blocks) {
            console.log('received blocks:', blocks)
            this.refList = blocks.map(x => {
                return {
                    id: x.block_id,
                    text: x.block_text,
                    actual: x,
                }
            })
        },
        handleBlockQueryFailure(msg) {
            console.log(msg)
        },
        handleReferenceSearchQueryUpdate(objType, query) {
            if (!query) { // empty text - user types in reference pair or presses backspace to clear search query
                return
            }
            else if (objType === 'Page') {
                metaOperations.searchPagesByName(query, this.handlePageNameQuerySuccess, this.handlePageNameQueryFailure)
            }
            else if (objType === 'Block') {
                metaOperations.searchBlocksByText(query, this.handleBlockQuerySuccess, this.handleBlockQueryFailure)
            }
        },
        handleBlockReferencesDialog() {
            this.showRefList = !this.showRefList
            console.log(this.blockObj.references)
            console.log('show ref list:', this.showRefList)
        },

        ///
        /// Relays
        ///

        relayBlockUpdate(newBlock, shouldFocus) {
            this.$emit('request-block-update', newBlock, shouldFocus)
        },
        relayBlurRequest(blockID, finalText) {
            this.$emit('request-blur', blockID, finalText)
        },
        relayIndentRequest(blockID, latestText) {
            this.$emit('request-indent', blockID, latestText)
        },
        relayOutdentRequest(blockID, latestText) {
            this.$emit('request-outdent', blockID, latestText)
        },
        relayNavigateUpRequest() {
            this.$emit('request-navigate-up')
        },
        relayNavigateDownRequest() {
            this.$emit('request-navigate-down')
        },
        relayFocusRequest(blockID) {
            this.$emit('request-focus', blockID)
        },
        relayBlockDeleteRequest(blockID) {
            this.$emit('request-delete-block', blockID)
        },
        relayNewBlockRequest(blockID) {
            this.$emit('request-create-block', blockID)
        },
        relayNewlyReferencedBlock(pageName, reference) {
            this.$emit('referenced-new-block', pageName, reference)
        },

        updateReferenceSelectionDialogPosition() {
            this.$nextTick(() => {
                this.inputTagRect = this.$refs.baseEditor?.getInputRect()
            })
        },
    },
}
</script>

<template>
    <div
      class="be-wrapper"
      :style="{ marginLeft: ((indentionLevel * 20) + 'px') }">

        <div class="be-text-line">
            <div class="be-info">
                <!-- TODO add menu for copying Block ID to clipboard -->
            </div>

            <base-editor
              :key="blockObj.id"
              :editing-id="editingID"
              :rootObjID="blockObj.id"
              :readonly-text="blockObj.content"
              :textToHTMLFunction="MarkdownToHTML"
              @update-text="handleBlockUpdate"
              @blur-requested="handleBlurRequest"
              @indent-requested="handleIndentRequest"
              @outdent-requested="handleOutdentRequest"
              @focus-for-edit-request="handleFocusRequest"
              @navigate-up-requested="handleNavigateUpRequest"
              @delete-object-requested="handleBlockDeleteRequest"
              @navigate-down-requested="handleNavigateDownRequest"
              @create-new-object-requested="handleNewBlockRequest"
              @reference-symbol-detected="handleOpenReferenceSelectionDialog"
              @outside-ref-symbols-detected="handleCloseReferenceSelectionDialog"
              @search-query-requested="handleReferenceSearchQueryUpdate"
              ref="baseEditor"
            />

            <div @click="handleBlockReferencesDialog">
                <!-- TODO add reference information (# references with a dialog that shows all references when clicked)-->
                 {{ blockObj.references?.length || '' }}
                 <code v-if="showRefList">{{ blockObj.references }}</code>
            </div>
        </div>
        
         <BlockReferenceSelectionDialog
           :componentRect="inputTagRect"
           :has-focus="isEditing && showRefSelectionDialog"
           :search-results="refList"
           @reference-selected="handleReferenceSelected"
           ref="refSelectionDialog"/>

        <block-editor
          v-for="child in blockObj.children"
          :key="child.id"
          :block-obj="child"
          :editingID="editingID"
          :indention-level="(indentionLevel + 1)"
          :refocus-key="refocusKey"
          @request-blur="relayBlurRequest"
          @request-focus="relayFocusRequest"
          @request-indent="relayIndentRequest"
          @request-outdent="relayOutdentRequest"
          @request-block-update="relayBlockUpdate"
          @request-create-block="relayNewBlockRequest"
          @request-navigate-up="relayNavigateUpRequest"
          @request-navigate-down="relayNavigateDownRequest"
          @request-delete-block="relayBlockDeleteRequest"
          @referenced-new-block="relayNewlyReferencedBlock"
        />
    </div>
</template>

<style>
.be-wrapper {
    padding: 0;
    margin: 0;
}

.be-text-line {
    display: flex;
    flex-direction: row;
    margin: 0;
    width: 100%;
}

.be-text-edit {
    width: 100%;
    flex: 1 1 0;
}

.be-info {
    background-color: red;
    padding: 0.25em;
}

.be-converted-text {
    padding: 0;
    width: 100%;
}
</style>
