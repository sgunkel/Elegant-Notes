<script>
import { constants } from '@/constants.js';
import { store } from '@/store.js';

export default {
    props: {
        pages: [],
    },
    data() {
        return {
            //
        }
    },
    methods: {
        openNewPageDialog() {
            this.$router.push(constants.PAGES.NEW_PAGE)
        },
        pageClicked(pageObj) {
            store.setPage(pageObj)
            this.$router.push(constants.PAGES.PAGE)
        },
    }
}
</script>

<template>
    <div class="plv-wrapper">
        <div class="plv-header-info">
            <h2>All Pages</h2>
            <div class="plv-new-page-dialog-btn" @click="openNewPageDialog">
                <span>New Page</span>
            </div>
        </div>
        <div v-for="page in pages">
            <div class="plv-page-list" @click="pageClicked(page)">
                <h3>{{ page.name }}</h3>
            </div>
        </div>
    </div>
</template>

<style>
.plv-wrapper {
    padding: 0.25em;
}

.plv-header-info {
    margin: 0;
    padding: 0.15em;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
.plv-header-info > h2 {
    margin: 0;
    padding: 0.25em 0;
}

.plv-new-page-dialog-btn {
    padding: 0 0.5em;
    border: 0.15em solid #000;
    border-radius: 0.25em;
    align-content: center;
}

.plv-page-list {
    border: 0.15em solid #000;
    border-radius: 0.25em;
    padding: 0.5em;
    margin: 0.25em 0;
}
</style>
