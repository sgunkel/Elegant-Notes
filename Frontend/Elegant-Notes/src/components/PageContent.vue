<script>
import { store } from '@/store.js'

import BlockEditor from './Editors/BlockEditor.vue';
import PageNameEditor from './Editors/PageNameEditor.vue';
import PageRenameDialog from './Dialogs/PageRenameDialog.vue';

import BacklinkReference from './BacklinkReference.vue';
import { pageOperations } from '@/helpers/pageFetchers.js';
import { metaOperations } from '@/helpers/metaFetchers.js'
import { createDebounce } from '@/helpers/debouncer';
import { md2json } from '@/helpers/md2json';
import { json2md } from '@/helpers/json2MdConverter';

import { marked } from 'marked';

import { v4 as uuidv4 } from 'uuid'
import { blockUtilities } from '@/helpers/blockUtilities';

export default {
    components: {
        BlockEditor,
        BacklinkReference,
        PageNameEditor,
        PageRenameDialog,
    },
    data() {
        return {
            page: store.getPage(),
            content: '',
            backlinks: [],
            rootLevelBlocks: [],
            editingId: null,        // The Block or Page with focus
            pendingFocusId: null,   // Flag to prevent race condition when a BaseEditor
                                    //     loses focus to another
            refocusKey: 0,
            pageDialogMeta: {
                showDialog: false,
                newName: store.getPage().name,
                oldName: store.getPage().name
            },
        }
    },
    computed: {
        MarkdownAsHTML() {
            return marked(this.content)
        }
    },
    watch: {
        rootLevelBlocks: {
            deep: true,
            handler(val) {
                // console.log('[rootLevelBlocks] updated:', val)
            }
        }
    },
    setup() {
        return {
            debounce: createDebounce(),
        };
    },
    mounted() {
        this.page.id = uuidv4()
        const receivedPageFn = (data) => {
            this.content = data.content
            this.rootLevelBlocks = md2json(this.content)
            console.log(this.rootLevelBlocks)
        }
        const pageNotReceivedFn = (errorMsg) => console.log(`error receiving page: ${errorMsg}`)
        pageOperations.getPageByName(this.page.name, receivedPageFn, pageNotReceivedFn)

        this.loadBacklinks()
    },
    methods: {
        logOut() {
            store.setJWTToken(undefined)
        },
        updateDocument() {
            console.log(`${new Date().toLocaleString()}: updating doc`)
            const data = {
                name: this.page.name,
                content: json2md(this.rootLevelBlocks, 0)
            }
            console.log(data)
            pageOperations.updatePage(data, (errorMsg) => {})
        },
        splitIntoLines() {
            return this.content.split('\n')
        },
        handleUpdate(updatedBlock, keepFocus, shouldDebounce = true) {
            console.log(new Date().toLocaleString(), 'keepFocus:', keepFocus, updatedBlock)
            if (keepFocus !== undefined && !keepFocus) { // idk how, but keepFocus can be randomly undefined even though I've checked everything and have confirmed that it should be a boolean value
                this.editingId = null
            }
            
            blockUtilities.updateRecursive(this.rootLevelBlocks, updatedBlock)
            this.debounce(() => {
                this.updateDocument()
            }, 1000)
        },
        navigateTo(direction) {
            const flatList = blockUtilities.flattenBlocks(this.rootLevelBlocks)
            const currentIndex = flatList.findIndex(b => b.id === this.editingId)
            if (currentIndex === -1) { return }

            const targetIndex = ((direction === 'up') ? currentIndex - 1 : currentIndex + 1)
            if (flatList[targetIndex]) {
                this.editingId = flatList[targetIndex].id
            }
            this.refocusKey++
        },
        createBlockAfter(targetId) {
            const newBlock = {
                id: uuidv4(),
                content: '',
                children: []
            }

            // Note that we are creating a copy of `rootLevelBlocks` by stringifying/parsing it
            const blocksCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.insertAfterRecursive(blocksCopy, newBlock, targetId)) {
                this.rootLevelBlocks = blocksCopy
                this.editingId = newBlock.id
                // BlockEditor components handle <input> focus logic
            }
        },
        deleteBlock(blockID) {
            const copy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.deleteByID(copy, blockID)) {
                this.rootLevelBlocks = copy
                // The Block that was deleted already handled shifting focus to the next block
            }
        },
        indentBlock(blockId, newContent) {

            /// THIS DOESN'T WORK UNLESS THERE'S BEEN TIME FOR THE DEBOUNCE TO COMPLETE!!!

            console.log('indent', blockId, newContent)
            const updateFn = (moved, success) => this.handleUpdate(moved, success)
            const idChangedFn = (newID) => this.editingId = newID
            const copy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.indent(blockId, copy, newContent, updateFn, idChangedFn)) {
                this.rootLevelBlocks = copy
                this.refocusKey++
            }
        },
        outdentBlock(blockId, newText) {
            const blocksCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            let [success, movedBlock, blocksNewCopy] = blockUtilities.outdentRecursive(blocksCopy, blockId, newText)
            if (success) {
                this.rootLevelBlocks = blocksNewCopy
                this.handleUpdate(movedBlock, true);
                this.refocusKey++;
                this.editingId = blockId;
            }
        },
    
        loadBacklinks() {
            const receivedBacklinkFn = (data) => this.backlinks = data
            const couldNotReceiveBacklinksFn = (errorMsg) => console.log(`error receiving backlinks: ${errorMsg}`)
            metaOperations.getBacklinks(this.page.name, receivedBacklinkFn, couldNotReceiveBacklinksFn)
        },

        ///
        /// Page Dialog Helpers
        ///

        HandlePageRename(newName) {
            if (newName !== this.pageDialogMeta.oldName) {
                this.pageDialogMeta.newName = newName
                this.pageDialogMeta.showDialog = true
            }
        },
        HandlePageRenameConfirm(renameReferences) {
            this.pageDialogMeta.showDialog = false
            this.refocusKey++
            
            // Send page rename request
            const pageRenameRequest = {
                'old_name': this.pageDialogMeta.oldName,
                'new_name': this.pageDialogMeta.newName,
                'references_to_update': renameReferences, // already converted to the correct format from the PageRenameDialog function
            }
            const pageSuccessfullyRenamed = (msg) => {
                console.log('Page rename successful', msg)
                this.loadBacklinks() // Load the new Backlinks
            }
            const pageFailedToBeRenamed = (msg) => console.log('Page could not be renamed:', msg)
            pageOperations.renamePage(pageRenameRequest, pageSuccessfullyRenamed, pageFailedToBeRenamed)
            this.page.name = this.pageDialogMeta.oldName = this.pageDialogMeta.newName
        },
        HandlePageRenameCancel() {
            this.pageDialogMeta.showDialog = false
            this.pageDialogMeta.newName = this.pageDialogMeta.oldName
        },

        ///
        /// Block Editor Helpers
        ///

        updateBlockText(blockID, newText) {
            //
        },
        focusBlockAbove(blockID) {
            // console.log(new Date().toLocaleString(), 'above', blockID, this.editingId)
            this.navigateTo('up')
        },
        focusBlockBelow(blockID) {
            // console.log(new Date().toLocaleString(), 'below', blockID, this.editingId)
            this.navigateTo('down')
        },

        ///
        /// Handlers
        ///

        handleEditRequest(objID) {
            this.pendingFocusId = objID
            this.editingId = objID
            this.refocusKey++
        },
        handleTextUpdate(objID, newText) {
            if (objID === this.page.id) {
                // We do not update the Page name in real time
            }
            else {
                this.updateBlockText(objID, newText)
            }
        },
        handleBlurRequest(objID, finalText) {
            if (this.pendingFocusId === objID && objID != this.page.id) {
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

            if (objID === this.page.id) {
                this.HandlePageRename(finalText)
            }
            else {
                this.updateBlockText(objID, finalText) // this should use `handleUpdate` but takes in a new block object
            }

            if (this.editingId === objID) {
                this.editingId = undefined // another object requested focus, and the previous object's `blur` signal fired afterward
            }
            this.refocusKey++
        },
    }
}
</script>

<template>
    <div
      class="page-logout-btn"
      @click="logOut()">
        Log out
    </div>
    <PageRenameDialog v-if="pageDialogMeta.showDialog"
      :new-page-name="pageDialogMeta.newName"
      :old-page-name="pageDialogMeta.oldName"
      :references="backlinks"
      @rename-confirmed="HandlePageRenameConfirm"
      @rename-cancelled="HandlePageRenameCancel"
    />
    <div v-else>
        <PageNameEditor
          :editing-id="editingId"
          :page-obj="page"
          :key="refocusKey"
          @request-blur="handleBlurRequest"
          @request-focus="handleEditRequest"
        />
        
        <div class="page-content-wrapper">
            <BlockEditor
              v-for="block in rootLevelBlocks"
              :block-obj="block"
              :indention-level="0"
              :editingID="editingId"
              :refocus-key="refocusKey"
              :key="refocusKey"
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

            <div class="pc-back-links-section">
                <BacklinkReference
                  v-for="backlink in backlinks"
                  :pageReferences="backlink">
                </BacklinkReference>
            </div>
        </div>
    </div>
</template>

<style>
.page-content-wrapper {
    display: flex;
    flex-direction: column;
    overflow: auto;
    width: 100%;
    height: 100%;
}

.page-logout-btn {
    padding: 0.25em;
    border: 0.15em solid #000;
    border-radius: 0.15em;
}

.page-content-back-links-section {
    overflow: auto;
    flex: 1 0 0;
}
</style>
