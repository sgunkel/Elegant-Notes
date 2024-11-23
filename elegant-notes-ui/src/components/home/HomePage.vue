<script>
import { store } from '@/store.js';
import { constants } from '@/constants.js';

export default {
    data() {
        return {
            store,
            pages: [],
        }
    },
    mounted() {
        try {
            store.fetchFromServer(constants.URLs.ALL_PAGES, {}, 'GET')
              .then(data => this.pages = data)
        } catch (e) {
            console.log(e) // TODO: how do we want to handle/show errors?
        }
    }
}
</script>

<template>
    <h1>hi there</h1>
    <h3 v-for="page in pages">{{ page }}</h3>
</template>

<style>
</style>
