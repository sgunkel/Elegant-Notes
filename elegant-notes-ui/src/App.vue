<script>
import CreateAccount from '@/components/authentication/CreateAccount.vue';

export default {
    components: {
        CreateAccount
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
    <CreateAccount v-else
      v-on:got-token="gotToken"></CreateAccount>
</template>

<style>
</style>
