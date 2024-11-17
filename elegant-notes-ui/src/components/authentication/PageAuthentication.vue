<script>
import CreateAccount from './CreateAccount.vue';
import Login from './Login.vue';

export default {
    emits: [
        'gotToken'
    ],
    components: {
        CreateAccount,
        Login
    },
    data() {
        return {
            showCreateAccountView: true,
        }
    },
    methods: {
        showCreateAccount() {
            this.showCreateAccountView = true
        },
        showLogin() {
            this.showCreateAccountView = false
        },
        receiveToken(token) {
            this.$emit('gotToken', token)
        }
    }
}
</script>

<template>
    <CreateAccount
      v-if="this.showCreateAccountView"
      v-on:gotToken="receiveToken"
      @switchToLoginPage="showLogin()">
    </CreateAccount>
    <Login
      v-else
      v-on:gotToken="receiveToken"
      @switchToAccountCreation="showCreateAccount()">
    </Login>
</template>

<style>
</style>
