<script>
import { store } from '@/store.js';
import { constants } from '@/constants.js';
import BlockContentView from './BlockContentView.vue';

export default {
    props: {
        page: Object
    },
    components: {
        BlockContentView,
    },
    data() {
        return {
            content: []
        }
    },
    mounted() {
        const pageID = this.page['@id'].replace('Page/', '')
        const url = `${constants.URLs.PAGE_BY_ID}/${pageID}`
        store.fetchFromServer(url, {}, 'GET')
          .then(data => this.content = data)
    },
    methods: {
        addChild(child) {
            child.parent_id = this.page['@id']
            this.content.children.push(child)
        },
        removeChild(child) {
            const siblingIndex = this.content.children.indexOf(child)
            if (siblingIndex === -1) {
                console.log('Could not find child at root level')
                return
            }
            this.content.children.splice(siblingIndex, 1)
        },
    }
}
</script>

<template>
    <h1>page content</h1>
    <h3>{{ page.name }}</h3>
    <BlockContentView
      v-for="(child, index) in content.children || []"
      :index="index"
      :block="child"
      :parent="content"
      :at-root="true"
      @add-child="addChild"
      @remove-child="removeChild">
    </BlockContentView>
</template>

<style>
</style>
