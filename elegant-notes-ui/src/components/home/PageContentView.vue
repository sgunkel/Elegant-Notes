<script>
import { store } from '@/store.js';
import { constants } from '@/constants.js';

export default {
    props: {
        page: Object
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
    <h3>{{ page }}</h3>
    <ul>
        <li v-for="child in content.children || []">{{ child }}</li>
    </ul>
</template>

<style>
</style>
