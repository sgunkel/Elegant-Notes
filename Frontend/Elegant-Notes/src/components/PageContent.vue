<script>
import { v4 as uuidv4 } from 'uuid'

import { store } from '@/store.js'

import BlockEditor from './Editors/BlockEditor.vue';
import PageNameEditor from './Editors/PageNameEditor.vue';
import PageRenameDialog from './Dialogs/PageRenameDialog.vue';
import BacklinkReference from './BacklinkReference.vue';

import { pageOperations } from '@/helpers/pageFetchers.js';
import { metaOperations } from '@/helpers/metaFetchers.js'
import { createDebounce } from '@/helpers/debouncer.js';
import { blockUtilities } from '@/helpers/blockUtilities.js';
import { pageUtils } from '@/helpers/pageUtils.js';
import { editorConstants } from '@/constants/editorConstants.js';

export default {
    components: {
        BlockEditor,
        BacklinkReference,
        PageNameEditor,
        PageRenameDialog,
    },
    data() {
        return {
            page: store.getPage(), // moving this to be a prop might be beneficial

            rootLevelBlocks: [],
            linkage: {
                backlinks: [],
            },

            editingId: null,        // The Block or Page with focus
            pendingFocusId: null,   // Flag to prevent race condition when a BaseEditor
                                    //     loses focus to another
            refocusKey: 0,          // Easy way to update the root level editors after an action

            pageDialogMeta: {
                showDialog: false,
                newName: store.getPage().name, // if the page object is moved to a prop (which it should), we'll need to update this and below
                oldName: store.getPage().name
            },
        }
    },
    setup() {
        return {
            debounce: createDebounce(),
        };
    },
    mounted() {
        this.page.id = uuidv4() // if we take the page as a prop, we should have this handled for us at a higher level
        pageOperations.getPageByName(this.page.name, this.onPageFetchSuccess, this.onPageFetchFail)
        this.loadBacklinks()
    },
    methods: {
        logOut() {
            store.setJWTToken(undefined)
        },
        refreshEditors() {
            this.refocusKey++
        },
        updateDocument() {
            console.log(`${new Date().toLocaleString()}: updating doc`)
            const data = pageUtils.createDocUpdateRequest(this.page.name, this.rootLevelBlocks)
            console.log(data)
            pageOperations.updatePage(data, this.onUpdateDocumentFail)
        },

        ///
        /// Block Editor Handlers
        ///

        handleUpdate(updatedBlock, keepFocus) {
            if (keepFocus !== undefined && !keepFocus) { // idk how, but keepFocus can be randomly undefined even though I've checked everything and have confirmed that it should be a boolean value
                this.editingId = null
            }
            
            blockUtilities.updateRecursive(this.rootLevelBlocks, updatedBlock)
            this.debounce(this.updateDocument, editorConstants.pageUpdateDebounceDelayMS)
        },
        changeEditIDByOffset(offset) {
            // Flatten root level objects to an array, get the index of the focused Block,
            //     and change the ID based on the offset.
            const flatList = blockUtilities.flattenBlocks(this.rootLevelBlocks)
            const currentIndex = flatList.findIndex(b => b.id === this.editingId)
            if (currentIndex === -1) { return }

            const targetIndex = currentIndex + offset
            if (flatList[targetIndex]) {
                this.editingId = flatList[targetIndex].id
            }
            this.refreshEditors()
        },
        createBlockAfter(targetId) {
            const newBlock = blockUtilities.createNewBlock()
            const blocksCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.insertAfterRecursive(blocksCopy, newBlock, targetId)) {
                this.rootLevelBlocks = blocksCopy
                this.editingId = newBlock.id // Automatically focuses the BaseEditor belonging to `newBlock`
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
            const copy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.indent(blockId, copy, newContent, this.onBlockIndentUpdate, this.onBlockIndentEditIDChange)) {
                this.rootLevelBlocks = copy
                this.refreshEditors()
            }
        },
        outdentBlock(blockId, newText) {
            const blocksCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            let [success, movedBlock, blocksNewCopy] = blockUtilities.outdentRecursive(blocksCopy, blockId, newText) // we'll update this later (I seriously cannot look at it without dying inside right)
            if (success) {
                this.rootLevelBlocks = blocksNewCopy
                this.handleUpdate(movedBlock, true);
                this.editingId = blockId;
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
        /// Metadata Handlers
        ///
    
        loadBacklinks() {
            metaOperations.getBacklinks(this.page.name, this.onBacklinksReceiveSuccess, this.onBacklinksReceiveFail)
        },

        ///
        /// Page Dialog Handlers
        ///

        HandlePageRename(newName) {
            if (newName !== this.pageDialogMeta.oldName) {
                this.pageDialogMeta.newName = newName
                this.pageDialogMeta.showDialog = true
            }
        },
        HandlePageRenameConfirm(renameReferences) {
            this.pageDialogMeta.showDialog = false
            this.refreshEditors()
            
            // Send page rename request
            const pageRenameRequest = pageUtils.createPageRenameRequest(this.pageDialogMeta.oldName, this.pageDialogMeta.newName, renameReferences)
            pageOperations.renamePage(pageRenameRequest, this.onPageRenameSuccess, this.onPageRenameFail)
            this.page.name = this.pageDialogMeta.oldName = this.pageDialogMeta.newName
        },
        HandlePageRenameCancel() {
            this.pageDialogMeta.showDialog = false
            this.pageDialogMeta.newName = this.pageDialogMeta.oldName
        },

        ///
        /// Shared Handlers
        ///

        handleEditRequest(objID) {
            this.pendingFocusId = objID
            this.editingId = objID
            this.refreshEditors()
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
            // Blocks are already updated immediately by `handleUpdate`, so no need for that here

            if (this.editingId === objID) {
                this.editingId = undefined // another object requested focus, and the previous object's `blur` signal fired afterward
            }
            this.refreshEditors()
        },

        //
        // Callbacks
        //

        onPageFetchSuccess(data) {
            this.rootLevelBlocks = pageUtils.convertPageContentToBlockNodes(data.content)
            console.log(this.rootLevelBlocks)
        },
        onPageFetchFail(errorMsg) {
            console.log(`error receiving page: ${errorMsg}`)
        },
        onUpdateDocumentFail(errorMsg) {
            // TODO show error somehow..?
        },
        onBlockIndentUpdate(indentedBlock, wasSuccessful) {
            this.handleUpdate(indentedBlock, wasSuccessful)
        },
        onBlockIndentEditIDChange(newID) {
            this.editingId = newID
        },
        onBacklinksReceiveSuccess(backlinkData) {
            this.linkage.backlinks = backlinkData
        },
        onBacklinksReceiveFail(errorMsg) {
            // better error message notifying
            console.log(`error receiving backlinks: ${errorMsg}`)
        },
        onPageRenameSuccess(msg) {
            console.log('Page rename successful', msg)
            this.loadBacklinks()
        },
        onPageRenameFail(msg) {
            console.log('Page could not be renamed:', msg)
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
      :references="linkage.backlinks"
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
                  v-for="backlink in linkage.backlinks"
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
