<script>
import { store } from '@/store.js'
import { fetchWithToken } from '@/utils.js'

import Block from './Block.vue'
import BacklinkReference from './BacklinkReference.vue';

import { marked } from 'marked';

export default {
    components: {
        Block,
        BacklinkReference,
    },
    data() {
        return {
            page: store.getPage(),
            content: '',
            backlinks: []
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
            .then(data => this.content = data.content)
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
    
    <div class="pc-wrapper">
        <textarea
        v-model="content"
        @input="debounce(updateDocument, 1000)"
        class="pc-page-text">
        </textarea>

        <div class="pc-back-links-section">
            <BacklinkReference
              v-for="backlink in backlinks"
              :pageReferences="backlink">
            </BacklinkReference>
        </div>
    </div>
</template>

<style>
.pc-wrapper {
    display: flex;
    flex-direction: column;
    overflow: auto;
    width: 100%;
    height: 100%;
}

.pc-page-text {
    height: 100%;
    flex: 1 0 0;
}

.pc-back-links-section {
    overflow: auto;
    flex: 1 0 0;
}
</style>
