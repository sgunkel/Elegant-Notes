<script>
import { store } from '@/store.js'
import { fetchWithToken } from '@/utils.js'

import BacklinkReference from './BacklinkReference.vue';
import { parseMarkdownToBlocks } from '@/BlockUtils';

import { marked } from 'marked';
import BlockEditor from './BlockEditor.vue';

import { v4 as uuidv4 } from 'uuid'

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
        }
    },
    computed: {
        MarkdownAsHTML() {
            return marked(this.content)
        }
    },
    setup()
    {
        // https://stackoverflow.com/questions/64990541/how-to-implement-debounce-in-vue3
        function createDebounce() {
            let timeout = null;
            return function (fnc, delayMs) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    fnc();
                }, delayMs || 500);
            };
        }

        return {
            debounce: createDebounce(),
        };
    },
    mounted() {
        fetch(`/page/get/${this.page.name}`)
            .then(response => response.json())
            .then(data => {
                this.content = data.content
                this.rootLevelBlocks = parseMarkdownToBlocks(this.content)
                console.log(this.rootLevelBlocks)
            })
        fetch(`/meta/backlinks/${this.page.name}`)
            .then(response => response.json())
            .then(data => this.backlinks = data)
    },
    methods: {
        updateDocument() {
            console.log(`${new Date().toLocaleString()}: updating doc`)
            const data = {
                name: this.page.name,
                content: this.content
            }
            fetchWithToken('/page/update', data, 'POST')
        },
        splitIntoLines() {
            return this.content.split('\n')
        },
        handleUpdate(updatedBlock) {
            // Traverse and update block in nested structure
            const updateRecursive = (blocks) => { // TODO move this to its own file
                return blocks.map(block => {
                    if (block.id === updatedBlock.id) {
                        return { ...updatedBlock }
                    } else if (block.blocks) {
                        return { ...block, blocks: updateRecursive(block.blocks) }
                    }
                    return block
                })
            }
            this.blocks = updateRecursive(this.rootLevelBlocks)
            this.editingId = null
            // TODO actually send the updated stuff to the backend
        },
        navigateTo(direction) {
            const flattenBlocks = (blocks, flatList = []) => { // TODO move this to its own utilities file
                blocks.forEach(block => {
                    flatList.push(block)
                    if (block.children.length > 0) {
                        flattenBlocks(block.children, flatList)
                    }
                })
                return flatList
            }

            const flatList = flattenBlocks(this.rootLevelBlocks)
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

            const insertAfterRecursive = (blocks) => { // TODO move this to its own file
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i]
                    if (block.id === targetId) {
                        // New entry should be the first child if the block already has
                        //   children - seems more natural
                        if (block.children.length > 0) {
                            block.children.unshift(newBlock);
                        } else {
                            // Insert the new entry as a sibling
                            blocks.splice(i + 1, 0, newBlock);
                        }
                        return true;
                    } else if (block.children) {
                        const inserted = insertAfterRecursive(block.children)
                        if (inserted) { return true }
                    }
                }
                return false
            }

            const blocksCopy = JSON.parse(JSON.stringify(this.rootLevelBlocks))
            if (insertAfterRecursive(blocksCopy)) {
                this.rootLevelBlocks = blocksCopy
                this.editingId = newBlock.id
                // BlockEditor components handle <input> focus logic
            }
        },
    }
}
</script>

<template>
    <h1>{{ page.name }}</h1>
    
    <div class="page-content-wrapper">
        <BlockEditor
          v-for="block in rootLevelBlocks"
          :key="block.id"
          :block="block"
          :editing-id="editingId"
          :level="0"
          ref="blockEditors"
          :ref-for="true"
          @start-editing="editingId = $event"
          @update-block="handleUpdate"
          @navigate="navigateTo"
          @create-block-after="createBlockAfter"
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

.page-content-back-links-section {
    overflow: auto;
    flex: 1 0 0;
}
</style>
