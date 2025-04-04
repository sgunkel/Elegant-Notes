<script>
import { store } from '@/store.js'
import { fetchWithToken } from '@/utils.js'
import Block from './Block.vue'

import { marked } from 'marked';

export default {
    components: {
        Block,
    },
    data() {
        return {
            page: store.getPage(),
            content: '',
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
    <textarea
      v-model="content"
      @input="debounce(updateDocument, 1000)"
      class="pc-page-text">
    </textarea>

    <!-- <div class="pc-page-text">
        <div v-for="line in splitIntoLines()">
            <Block
              :text="line">
            </Block>
        </div>
    </div> -->

    <!-- <div class="pc-page-text" v-html="MarkdownAsHTML"></div> -->
</template>

<style>
.pc-page-text {
    width: 100%;
    height: 100%;

    overflow: auto;
}
</style>
