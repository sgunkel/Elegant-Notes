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
            showCreateAccountView: false,
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
        },
    }
}
</script>

<template>
    <div class="pa-wrapper">
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
    </div>
</template>

<style>
/* TODO figure out why defining these here are referenced throughout all components */
form {
    margin: 0;
    padding: 1.25em;
    border: 0.15em solid #000;
    border-radius: 0.5em;
}

input {
    width: 100%;
    padding: 0.15em;
    margin-top: 0.25em;
}
input[type=submit] {
    padding: 0.75em;
    font-size: medium;
}
input[type=text],
input[type=password] {
    padding: 0.75em;
}

.pa-wrapper {
    width: 50%;
    margin-left: auto;
    margin-right: auto;
}
</style>
