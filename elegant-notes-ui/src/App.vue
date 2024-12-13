<script>
import PageAuthentication from './components/authentication/PageAuthentication.vue';
import HomePage from './components/home/HomePage.vue';
import { store } from './store.js';

store.init()

export default {
    components: {
        HomePage,
        PageAuthentication,
    },
    data() {
        return {
            store,
        }
    },
    methods: {
        gotToken(data) {
            store.setAccessToken(data)
        }
    }
}

</script>

<template>
    <router-view v-if="this.store.isAuthenticated()"/>
    <PageAuthentication
      v-else
      v-on:got-token="gotToken">
    </PageAuthentication>
</template>

<style>
</style>
