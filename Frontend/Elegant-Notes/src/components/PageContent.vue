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
            const json2md = (blocks, level) => {
                const indention = ' '.repeat(level)
                let content = ''
                blocks.forEach(block => {
                    content += indention + '- ' + block.content + '\n'
                    content += json2md(block.children, level + 4)
                })
                return content
            }
            console.log(`${new Date().toLocaleString()}: updating doc`)
            const data = {
                name: this.page.name,
                content: json2md(this.rootLevelBlocks, 0)// this.rootLevelBlocks
            }
            console.log(data)
            // fetchWithToken('/page/update', data, 'POST')
        },
        splitIntoLines() {
            return this.content.split('\n')
        },
        handleUpdate(updatedBlock, keepFocus, shouldDebounce = true) {
            // console.trace()
            // console.log('handle update from page (keep focus =', keepFocus, ')')
            if (keepFocus !== undefined && !keepFocus) { // idk how, but keepFocus can be randomly undefined even though I've checked everything and have confirmed that it should be a boolean value
                this.editingId = null
            }

            /// something broke the tabbing from working...

            // this.debounce(() => {
            //     // Traverse and update block in nested structure
            //     const updateRecursive = (blocks) => { // TODO move this to its own file
            //         return blocks.map(block => {
            //             if (block.id === updatedBlock.id) {
            //                 return { ...updatedBlock }
            //             } else if (block.blocks) {
            //                 return { ...block, blocks: updateRecursive(block.blocks) }
            //             }
            //             return block
            //         })
            //     }
            //     this.rootLevelBlocks = updateRecursive(this.rootLevelBlocks)
            //     this.updateDocument()
            // }, 1000)
            const updateRecursive = (blocks) => {
                blocks.forEach(block => {
                    if (block.id === updatedBlock.id) {
                        block.content = updatedBlock.content
                    } else if (block.children) {
                        updateRecursive(block.children)
                    }
                })
            }
            updateRecursive(this.rootLevelBlocks)
            this.debounce(() => {
                // const updateRecursive = (blocks) => {
                //     return blocks.map(block => {
                //         if (block.id === updatedBlock.id) {
                //             return { ...updatedBlock }
                //         } else if (block.children?.length > 0) {
                //             return { ...block, children: updateRecursive(block.children) }
                //         }
                //         return block
                //     })
                // }

                // const updated = updateRecursive(this.rootLevelBlocks)
                // const updateRecursive = (blocks) => {
                //     blocks.forEach(block => {
                //         if (block.id === updatedBlock.id) {
                //             block.content = updatedBlock.content
                //         } else if (block.children) {
                //             updateRecursive(block.children)
                //         }
                //     })
                // }
                // updateRecursive(this.rootLevelBlocks)
                // this.rootLevelBlocks = updated
                this.updateDocument()
            }, 1000)
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
        deleteBlock(blockID) {
            const deleteByID = (blocks, targetID) => {
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i]
                    if (block.id === targetID) {
                        // assume we have already checked that the given Block does **not** have children
                        blocks.splice(i, 1)
                        return true
                    }
                    else if (block.children && deleteByID(block.children, targetID)) {
                        return true
                    }
                }
                return false
            }
            const copy = JSON.parse(JSON.stringify(this.rootLevelBlocks))
            if (deleteByID(copy, blockID)) {
                this.rootLevelBlocks = copy
                // The Block that was deleted already handled shifting focus to the next block
            }
        },
        indentBlockOG(blockId) {
            // check out what ChatGPT said about this...
            console.log('indent')
            let movedBlock = null
            const indent = (blocks) => {
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i]
                    if (block.id === blockId && i > 0) {
                        const prev = blocks[i - 1]
                        // Move block into prev.children
                        if (!prev.children) prev.children = []
                        block.tabbing = true
                        prev.children.push(block)
                        blocks.splice(i, 1)
                        movedBlock = block
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
                this.handleUpdate(movedBlock, true)

                this.refocusKey++ // might be able to delete

                this.$nextTick(() => {
                    this.editingId = blockId;
                    requestAnimationFrame(() => {
                        const editors = this.$refs.blockEditors;
                        const targetEditor = Array.isArray(editors)
                            ? editors.find(ref => ref.block.id === blockId)
                            : editors?.block?.id === blockId
                                ? editors
                                : null;

                        if (targetEditor && typeof targetEditor.focusInput === 'function') {
                            targetEditor.focusInput();
                        }
                    })
                });
                
                // this.$nextTick(() => {
                //     this.editingId = blockId;
                //     const editors = this.$refs.blockEditors;
                //     const targetEditor = Array.isArray(editors)
                //         ? editors.find(ref => ref.block.id === blockId)
                //         : editors?.block?.id === blockId
                //             ? editors
                //             : null;

                //     if (targetEditor && typeof targetEditor.focusInput === 'function') {
                //         targetEditor.focusInput();
                //     }
                // });
            }
        },
        findParentArray(blocks, targetId) {
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];
                if (block.id === targetId) return blocks;
                if (block.children) {
                    const result = this.findParentArray(block.children, targetId);
                    if (result) return result;
                }
            }
            return this.rootLevelBlocks; // fallback
        },
        indentBlock(blockId, newContent) {

            /// THIS DOESN'T WORK UNLESS THERE'S BEEN TIME FOR THE DEBOUNCE TO COMPLETE!!!

            console.log('indent', blockId, newContent)
            const indent = (blocks, newText) => {
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];
                    if (block.id === blockId && i > 0) {
                        const prev = blocks[i - 1];
                        if (!prev.children) prev.children = [] // this.$set(prev, 'children', []);
                        
                        const [moved] = blocks.splice(i, 1);
                        prev.children.push(moved);

                        this.handleUpdate(moved, true);
                        this.editingId = blockId;
                        if (newText !== undefined) {
                            moved.content = newText
                        }
                        return true;
                    }
                    if (block.children && indent(block.children, newText)) return true;
                }
                return false;
            };

            indent(this.rootLevelBlocks, newContent);
        },
        outdentBlockv2(blockId, newContent) {
            console.log('outdent', blockId, newContent)
            let movedBlock = null;

            /// THIS DOESN'T WORK UNLESS THERE'S BEEN TIME FOR THE DEBOUNCE TO COMPLETE!!!

            const outdent = (blocks, newText, parent = null, parentArray = null) => {
                for (let i = 0; i < blocks.length; i++) {
                    const block = blocks[i];

                    if (block.id === blockId) {
                        console.log('old', block.content, 'new', newText)
                        if (newText !== undefined) {
                            block.content = newText
                        }

                        if (parent !== null && parentArray !== null) {
                            const removed = parentArray.splice(i, 1)[0];
                            // removed.content = newText

                            // Find the index of the parent in the grandparent array
                            const grandparentArray = this.findParentArray(this.rootLevelBlocks, parent.id);
                            const parentIndex = grandparentArray.findIndex(b => b.id === parent.id);
                            if (parentIndex !== -1) {
                                grandparentArray.splice(parentIndex + 1, 0, removed);
                            } else {
                                // fallback - push to top level
                                this.rootLevelBlocks.push(removed);
                            }

                            movedBlock = removed;
                            this.handleUpdate(movedBlock, true);
                            this.editingId = blockId;
                            return true;
                        }
                    }

                    if (block.children && outdent(block.children, newText, block, block.children)) return true;
                }
                return false;
            };

            outdent(this.rootLevelBlocks, newContent);
        },
        outdentBlock(blockId, newText) {
    const blocksCopy = JSON.parse(JSON.stringify(this.rootLevelBlocks));
    let movedBlock = null;

    const outdentRecursive = (
        blocks,
        parent = null,
        parentArray = null,
        grandparent = null,
        grandparentArray = blocksCopy
    ) => {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];

            if (block.id === blockId && parent !== null && parentArray !== null) {
                // 1. Grab the outdented block and the trailing siblings
                const removed = parentArray.splice(i, 1)[0];
                const trailingSiblings = parentArray.splice(i); // all after 'c'

                // 2. Move trailing siblings into 'removed.children'
                removed.children = removed.children.concat(trailingSiblings);

                if (newText !== undefined) {
                    removed.content = newText;
                }

                // 3. Find the index of parent in grandparent array
                const parentIndex = grandparentArray.findIndex(b => b.id === parent.id);
                if (parentIndex !== -1) {
                    grandparentArray.splice(parentIndex + 1, 0, removed);
                } else {
                    // fallback
                    blocksCopy.push(removed);
                }

                movedBlock = removed;
                return true;
            }

            if (block.children?.length > 0) {
                if (
                    outdentRecursive(
                        block.children,
                        block,
                        block.children,
                        parent,
                        parentArray || blocksCopy
                    )
                ) {
                    return true;
                }
            }
        }
        return false;
    };

    if (outdentRecursive(blocksCopy)) {
        this.rootLevelBlocks = blocksCopy;
        this.handleUpdate(movedBlock, true);
        this.refocusKey++;
        this.editingId = blockId;
    }
},
        outdentBlockOG(blockId) {
            console.log('outdent')
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
                        const removed = parentArray.splice(i, 1)[0];
                        const trailingSiblings = parentArray.slice(i + 1);
                        removed.children.push(...trailingSiblings);

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

                        block.shouldFocus = true

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
                this.handleUpdate(movedBlock, true)

                this.refocusKey++ // might not need anymore...

                this.$nextTick(() => {
                    this.editingId = blockId;
                    requestAnimationFrame(() => {
                        const editors = this.$refs.blockEditors;
                        const targetEditor = Array.isArray(editors)
                            ? editors.find(ref => ref.block.id === blockId)
                            : editors?.block?.id === blockId
                                ? editors
                                : null;

                        if (targetEditor && typeof targetEditor.focusInput === 'function') {
                            targetEditor.focusInput();
                        }
                    })
                });
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

.page-content-back-links-section {
    overflow: auto;
    flex: 1 0 0;
}
</style>
