<script>
/**
 * Page object editor with Page Rename support, Backlinks section, and Blocks editors.
 */

import { v4 as uuidv4 } from 'uuid'
import { store } from '@/store.js'

import PageNameEditor from './PageNameEditor.vue';
import PageRenameDialog from '../Dialogs/PageRenameDialog.vue';
import BacklinkReference from './BacklinkReferenceEditor.vue';
import PageBlocksEditor from './PageBlocksEditor.vue';

import { pageOperations } from '@/helpers/pageFetchers.js';
import { metaOperations } from '@/helpers/metaFetchers.js'
import { createDebounce } from '@/helpers/debouncer.js';
import { pageUtils } from '@/helpers/pageUtils.js';
import { notificationUtils } from '@/helpers/notifications.js';
import { blockUtilities } from '@/helpers/blockUtilities';
import { nextTick } from 'vue';
import { json2md } from '@/helpers/MarkdownJSONUtils';

export default {
    props: {
        pageInfo: Object,
    },
    components: {
        PageBlocksEditor,
        PageNameEditor,
        BacklinkReference,
        PageRenameDialog,
    },
    data() {
        return {
            store,
            page: store.getPage(), // moving this to be a prop might be beneficial
            pageContent: '',

            rootLevelBlocks: [],
            linkage: {
                backlinks: [],
                blockIDs: [],
                blockReferences: [],
            },

            pageRefocusKey: 0, // Easy way to update the root level editors after an action

            pageDialogMeta: {
                showDialog: false,
                newName: store.getPage().name,
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
        this.page.id = uuidv4()
        this.loadPage()
    },
    methods: {
        logOut() {
            store.setJWTToken(undefined)
        },
        refreshEditors() {
            this.pageRefocusKey++
        },
        updateDocument(updatedRootBlocks) {
            console.log(`${new Date().toLocaleString()}: updating doc`)
            this.rootLevelBlocks = updatedRootBlocks
            const data = pageUtils.createDocUpdateRequest(this.page.name, updatedRootBlocks)
            console.log(data)
            pageOperations.updatePage(data, this.onUpdateDocumentSuccess, this.onUpdateDocumentFail)
            this.pageContent = json2md(updatedRootBlocks, 0)
        },
        updateRootLevel(newRootLevel) {
            this.updateDocument(newRootLevel)
        },
        loadPage() {
            pageOperations.getPageByName(this.page.name, this.onPageFetchSuccess, this.onPageFetchFail)
        },

        ///
        /// Metadata Handlers
        ///
    
        loadBacklinks() {
            metaOperations.getReferences(this.page.name, this.linkage.blockIDs, this.onReferencesReceivedSuccess, this.onReferencesReceivedFail)
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
        /// Block Reference Handlers
        ///

        handleBlockRefAssignment(reference) {
            const blockCopy = blockUtilities.createBlocksCopy(this.rootLevelBlocks)
            if (blockUtilities.assignBlockReference(this.pageContent, blockCopy, reference)) {
                this.updateDocument(blockCopy)
            }
        },

        ///
        /// Handlers
        ///

        handlePageEditRequest(objID) {
            store.pendingFocusId = objID
            store.editingId = objID
            this.refreshEditors()
        },
        handlePageBlurRequest(objID, finalText) {

            if (objID === this.page.id) {
                this.HandlePageRename(finalText)
            }
            // Blocks are already updated immediately by `handleUpdate`, so no need for that here

            if (store.editingId === objID) {
                store.editingId = undefined // another object requested focus, and the previous object's `blur` signal fired afterward
            }
            this.refreshEditors()
        },

        //
        // Callbacks
        //

        onPageFetchSuccess(data) {
            this.pageContent = data.content
            const meta = pageUtils.convertPageContentToBlockNodes(this.pageContent)
            this.rootLevelBlocks = meta.rootLevel
            this.linkage.blockIDs = meta.blockIDs
            console.log(meta)

            this.loadBacklinks()
        },
        onPageFetchFail(errorMsg) {
            console.log(`error receiving page: ${errorMsg}`)
            notificationUtils.toastError(`Error loading page: ${errorMsg}`)
        },
        onUpdateDocumentSuccess(msg) {
            // might be useful later..
        },
        onUpdateDocumentFail(errorMsg) {
            notificationUtils.toastError(`Can not update Page: ${errorMsg}`)
        },
        onReferencesReceivedSuccess(references) {
            this.linkage.backlinks = references.backlinks
            this.linkage.blockReferences = references.block_refs
            console.log('block_refs:', references.block_refs)
            blockUtilities.assignAllBlockReferencesInPage(this.rootLevelBlocks, this.linkage.blockReferences)
        },
        onReferencesReceivedFail(errorMsg) {
            // TODO how should we actually display the error? It'll most likely be large and
            //     shouldn't be part of the toast notification...
            notificationUtils.toastError('Failed to receive references. Check console.log')
            console.log(`error receiving references: ${errorMsg}`)
        },
        onPageRenameSuccess(msg) {
            console.log('Page rename successful', msg)
            notificationUtils.toastSuccess(msg)
            this.loadBacklinks()
        },
        onPageRenameFail(msg) {
            notificationUtils.toastError(msg)
            console.log('Page could not be renamed:', msg)
        },
    }
}
</script>

<template>
    <div
      class="pe-logout-btn"
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
          :editing-id="store.editingId"
          :page-obj="page"
          :key="pageRefocusKey"
          @request-blur="handlePageBlurRequest"
          @request-focus="handlePageEditRequest"
        />
        
        <div class="pe-content-wrapper">
            <PageBlocksEditor
              :root-level-blocks="rootLevelBlocks"
              :page-name="page.name"
              :key="rootLevelBlocks"
              @update-document="updateDocument"
              @update-root-level="updateRootLevel"
              @assign-block-id="handleBlockRefAssignment"
            />

            <div class="pe-back-links-section">
                <BacklinkReference
                  v-for="backlink in linkage.backlinks"
                  :pageReferences="backlink">
                </BacklinkReference>
            </div>
        </div>
    </div>
</template>

<style>
.pe-content-wrapper {
    display: flex;
    flex-direction: column;
    overflow: auto;
    width: 100%;
    height: 100%;
}

.pe-logout-btn {
    padding: 0.25em;
    border: 0.15em solid #000;
    border-radius: 0.15em;
}

.page-content-back-links-section {
    overflow: auto;
    flex: 1 0 0;
}
</style>
