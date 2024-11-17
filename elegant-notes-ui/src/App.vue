<script>
import PageAuthentication from './components/authentication/PageAuthentication.vue';

export default {
    components: {
        PageAuthentication,
    },
    data() {
        return {
            token: undefined
        }
    },
    methods: {
        gotToken(data) {
            this.token = data
        }
    }
}

</script>

<template>
    <div v-if="this.token !== undefined">
        <h1>Signed in</h1>
        <h3>{{ this.token }}</h3>
    </div>
    <PageAuthentication
      v-else
      v-on:got-token="gotToken">
    </PageAuthentication>
</template>

<style>
</style>
