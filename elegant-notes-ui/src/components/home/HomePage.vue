<script>
import { store } from '@/store.js';
import { constants } from '@/constants.js';
import PageListView from './PageListView.vue';

export default {
    components: {
        PageListView,
    },
    data() {
        return {
            store,
            pages: [],
            currentPage: undefined,
        }
    },
    mounted() {
        try {
            store.fetchFromServer(constants.URLs.ALL_PAGES, {}, 'GET')
              .then(data => this.pages = data)
        } catch (e) {
            console.log(e) // TODO: how do we want to handle/show errors?
        }
    },
}
</script>

<template>
    <PageListView
      :pages="pages">
    </PageListView>
</template>

<style>
</style>
