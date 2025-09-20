<script>
import { store } from '@/store.js'

import BacklinkReference from './BacklinkReference.vue';
import { pageOperations } from '@/helpers/pageFetchers.js';
import { metaOperations } from '@/helpers/metaFetchers.js'
import { createDebounce } from '@/helpers/debouncer';
import { md2json } from '@/helpers/md2json';
import { json2md } from '@/helpers/json2MdConverter';

import { marked } from 'marked';
import BlockEditor from './BlockEditor.vue';

import { v4 as uuidv4 } from 'uuid'
import { blockUtilities } from '@/helpers/blockUtilities';

export default {
    components: {
        BlockEditor,
        BacklinkReference,
    },
    data() {
        return {
            page: store.getPage(),
            content: '',
            backlinks: [],
            rootLevelBlocks: [],
            editingId: null,
            refocusKey: 0,
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
    setup()
    {
        return {
            debounce: createDebounce(),
        };
    },
    mounted() {
        const receivedPageFn = (data) => {
            this.content = data.content
            this.rootLevelBlocks = md2json(this.content)
            console.log(this.rootLevelBlocks)
        }
        const pageNotReceivedFn = (errorMsg) => console.log(`error receiving page: ${errorMsg}`)
        pageOperations.getPageByName(this.page.name, receivedPageFn, pageNotReceivedFn)
        
        const receivedBacklinkFn = (data) => this.backlinks = data
        const couldNotReceiveBacklinksFn = (errorMsg) => console.log(`error receiving backlinks: ${errorMsg}`)
        metaOperations.getBacklinks(this.page.name, receivedBacklinkFn, couldNotReceiveBacklinksFn)
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
            blockUtilities.indent(blockId, this.rootLevelBlocks, newContent, updateFn, idChangedFn)
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
    }
}
</script>

<template>
    <div
      class="page-logout-btn"
      @click="logOut()">
        Log out
    </div>
    <h1>{{ page.name }}</h1>
    
    <div class="page-content-wrapper">
        <BlockEditor
          v-for="block in rootLevelBlocks"
          :key="block.id"
          :block="block"
          :editing-id="editingId"
          :level="0"
          :refocus-key="refocusKey"
          ref="blockEditors"
          :ref-for="true"
          @start-editing="editingId = $event"
          @update-block="handleUpdate"
          @navigate="navigateTo"
          @create-block-after="createBlockAfter"
          @delete-block="deleteBlock"
          @indent-block="indentBlock"
          @outdent-block="outdentBlock"
        />

        <div class="pc-back-links-section">
            <BacklinkReference
              v-for="backlink in backlinks"
              :pageReferences="backlink">
            </BacklinkReference>
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
