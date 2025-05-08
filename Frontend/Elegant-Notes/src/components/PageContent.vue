<script>
import { store } from '@/store.js'
import { fetchWithToken } from '@/utils.js'

import Block from './Block.vue'
import BacklinkReference from './BacklinkReference.vue';

import { marked } from 'marked';
import { parseMarkdownToBlocks } from '@/BlockUtils';
import BlockItem from './BlockItem.vue';

export default {
    components: {
        BlockItem,
        Block,
        BacklinkReference,
    },
    data() {
        return {
            page: store.getPage(),
            content: '',
            backlinks: [],
            rootLevelBlocks: [],
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
        }
    }
}
</script>

<template>
    <h1>{{ page.name }}</h1>
    
    <div class="page-content-wrapper">
        <BlockItem
            v-for="child in rootLevelBlocks"
            :key="child.id"
            :block="child"
            :level="0">
        </BlockItem>

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
