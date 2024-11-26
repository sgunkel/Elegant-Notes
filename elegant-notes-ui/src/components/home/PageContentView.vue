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
}
</script>

<template>
    <h1>page content</h1>
    <h3>{{ page.name }}</h3>
    <BlockContentView
      v-for="child in content.children || []"
      :block="child"
      :parent="page">
    </BlockContentView>
</template>

<style>
</style>
