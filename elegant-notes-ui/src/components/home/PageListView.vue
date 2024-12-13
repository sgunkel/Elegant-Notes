<script>
import { constants } from '@/constants.js';
import { store } from '@/store.js';

export default {
    props: {
        pages: []
    },
    data() {
        return {
            //
        }
    },
    methods: {
        pageClicked(pageObj) {
            store.setPage(pageObj)
            this.$router.push(constants.PAGES.PAGE)
        }
    }
}
</script>

<template>
    <h1>page list</h1>
    <div v-for="page in pages">
        <h3 @click="pageClicked(page)">{{ page }}</h3>
    </div>
</template>

<style>
</style>
