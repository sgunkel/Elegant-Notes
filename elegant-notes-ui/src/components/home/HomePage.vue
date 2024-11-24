<script>
import { store } from '@/store.js';
import { constants } from '@/constants.js';
import PageListView from './PageListView.vue';
import PageContentView from './PageContentView.vue';

export default {
    components: {
        PageListView,
        PageContentView,
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
    methods: {
        pageSelected(pageObj) {
            this.currentPage = pageObj
        }
    }
}
</script>

<template>
    <PageContentView
      v-if="this.currentPage !== undefined"
      :page="this.currentPage">
    </PageContentView>
    <PageListView
      v-else
      :pages="pages"
      @page-selected="pageSelected">
    </PageListView>
</template>

<style>
</style>
