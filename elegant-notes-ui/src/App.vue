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
    <HomePage
      v-if="this.store.isAuthenticated()">
    </HomePage>
    <PageAuthentication
      v-else
      v-on:got-token="gotToken">
    </PageAuthentication>
</template>

<style>
</style>
