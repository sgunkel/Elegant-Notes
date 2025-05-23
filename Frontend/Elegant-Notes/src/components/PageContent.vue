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
            /// ^^ do this after block delete and tab/shift+tab support
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

            // Note that we are creating a copy of `rootLevelBlocks` by stringifying/parsing it
            const blocksCopy = JSON.parse(JSON.stringify(this.rootLevelBlocks))
            if (insertAfterRecursive(blocksCopy)) {
                this.rootLevelBlocks = blocksCopy
                this.editingId = newBlock.id
                // BlockEditor components handle <input> focus logic
            }
        },
        indentBlock(blockId) {
            console.log('indent')
            const indent = (blocks) => {
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i]
                    if (block.id === blockId && i > 0) {
                        const prev = blocks[i - 1]
                        // Move block into prev.children
                        if (!prev.children) prev.children = []
                        prev.children.push(block)
                        blocks.splice(i, 1)
                        return true
                    }
                    if (block.children && indent(block.children)) {
                        return true
                    }
                }
                return false
            }

            const copy = JSON.parse(JSON.stringify(this.rootLevelBlocks))
            if (indent(copy)) {
                this.rootLevelBlocks = copy
                this.editingId = blockId
            }
        },
        outdentBlock(blockId) {
            // in case this isn't obvious, this was generated by ChatGPT as I struggled with
            //   this concept and was interested if it could do better than me (and
            //   surprisingly did)
            const blocksCopy = JSON.parse(JSON.stringify(this.rootLevelBlocks))
            let movedBlock = null

            const findAndOutdent = (blocks, parent = null, parentArray = null, grandparent = null, grandparentArray = blocksCopy) => {
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];

                    if (block.id === blockId && parent !== null) {
                        // Step 1: Capture all siblings after the outdented block
                        const trailingSiblings = parentArray.slice(i + 1);

                        // Step 2: Remove the block and the trailing siblings from parent
                        parentArray.splice(i); // removes from index i to end

                        // Step 3: Attach trailing siblings as children of the outdented block
                        block.children = block.children.concat(trailingSiblings);
                        movedBlock = block;

                        // Step 4: Insert the moved block after the parent in grandparentArray
                        const parentIndexInGrandparent = grandparentArray.findIndex(b => b.id === parent.id);
                        if (parentIndexInGrandparent !== -1) {
                            grandparentArray.splice(parentIndexInGrandparent + 1, 0, movedBlock);
                        } else {
                            blocksCopy.push(movedBlock); // fallback
                        }

                        return true;
                    }

                    if (block.children && block.children.length > 0) {
                        if (findAndOutdent(block.children, block, block.children, parent, blocks)) {
                            return true;
                        }
                    }
                }

                return false;
            };

            if (findAndOutdent(blocksCopy)) {
                this.rootLevelBlocks = blocksCopy
                this.editingId = blockId
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

.page-content-back-links-section {
    overflow: auto;
    flex: 1 0 0;
}
</style>
