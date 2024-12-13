<script>
import { handleLogin } from './shared.js'

export default {
    emits: [
        'gotToken',
        'switchToAccountCreation'
    ],
    data() {
        return {
            username: '',
            password: '',
            error: '',
        }
    },
    methods: {
        switchToAccountView() {
            this.$emit('switchToAccountCreation')
        },
        async submitForm() {
            handleLogin(this.username, this.password,
                this.successCallback,
                this.unsuccessCallback,
                this.errorCallback)
        },
        successCallback(token) {
            this.$emit('gotToken', token)
        },
        unsuccessCallback(message) {
            this.error = message
        },
        errorCallback(error) {
            this.error = `Unexpected error: ${error}`
        }
    }
}
</script>

<template>
    <h2>Login</h2>
    <h3 v-if="error" class="l-error-msg">{{ error }}</h3>
    <form @submit.prevent="submitForm">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" v-model="username" required>
        <label for="password">Password</label>
        <input type="password" name="password" id="password" v-model="password" required>
        <input type="submit" value="Login" class="l-switch-to-login-view">
    </form>
    <p @click="switchToAccountView" class="l-switch-to-login-view">Create account</p>
</template>

<style>
.l-switch-to-login-view {
    margin: 0.25em;
    padding: 0.25em;
    border: 0.15em solid #000;
    background-color: #fff;
    border-radius: 0.25em;
    text-align: center;
}

.l-error-msg {
    color: red;
}
</style>
