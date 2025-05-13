<script>
import { store } from '@/store.js'
import { fetchWithToken } from '@/utils.js'

import BacklinkReference from './BacklinkReference.vue';
import { parseMarkdownToBlocks } from '@/BlockUtils';

import { marked } from 'marked';
import BlockEditor from './BlockEditor.vue';

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
            const updateRecursive = (blocks) => {
                console.log(blocks)
                return blocks.map(block => {
                    console.log(block)
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
        },
    }
}
</script>

<template>
    <h1>{{ page.name }}</h1>
    
    <div class="page-content-wrapper">
        <!-- <BlockItem
            v-for="child in rootLevelBlocks"
            :key="child.id"
            :block="child"
            :level="0">
        </BlockItem> -->

        <BlockEditor
          v-for="block in rootLevelBlocks"
          :key="block.id"
          :block="block"
          :editing-id="editingId"
          :level="0"
          @start-editing="editingId = $event"
          @update-block="handleUpdate"
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
