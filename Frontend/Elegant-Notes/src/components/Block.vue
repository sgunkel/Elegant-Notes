<script>
import { marked } from 'marked';

export default {
    props: {
        text: String,
    },
    data() {
        return {
            // text: '',
            rawText: this.text,
        }
    },
    computed: {
        MarkdownAsHTML() {
            return marked(this.rawText)
        }
    },
}
</script>

<template>
    <div class="b-wrapper">
        <div v-html="MarkdownAsHTML"></div>
    </div>
</template>

<style>
.b-wrapper {
    margin: 0;
    padding: 0;
}
</style>
