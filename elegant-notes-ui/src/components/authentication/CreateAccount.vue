<script>
import { createFormRequest, handleLogin } from './shared.js';

export default {
    emits: [
        'gotToken',
        'switchToLoginPage'
    ],
    data() {
        return {
            username: '',
            password: '',
            fullName: '',
            errorMessage: '',
        }
    },
    methods: {
        switchToLoginView() {
            this.$emit('switchToLoginPage')
        },
        async sendFormRequest() {
            let signInWithAccount = false
            const payload = createFormRequest(this.username, this.password, this.fullName)
            await fetch('/user/add', payload)
              .then(response => response.json())
              .then(data => {
                if (data.detail) {
                    this.unsuccessCallback(data.detail)
                }
                else {
                    signInWithAccount = true
                }
              })
              .catch(error => this.errorCallback(error))
            if (signInWithAccount) {
                this.signInAndEmit()
            }
        },
        signInAndEmit() {
            handleLogin(this.username, this.password,
                this.successCallback,
                this.unsuccessCallback,
                this.errorCallback)
        },
        successCallback(token) {
            this.$emit('gotToken', token)
        },
        unsuccessCallback(message) {
            this.errorMessage = message
        },
        errorCallback(error) {
            this.errorMessage = `Unexpected error: ${error}`
        }
    }
}
</script>

<template>
    <h2>Create Account</h2>
    <h3 v-if="errorMessage !== ''" class="ca-error-msg">{{ errorMessage }}</h3>
    <form @submit.prevent="sendFormRequest" method="POST">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" v-model="username" required>
        <label for="password">Password</label>
        <input type="password" id="password" name="password" v-model="password" required>
        <label for="full_name">Full Name</label>
        <input type="text" id="full_name" name="full_name" v-model="fullName" required>
        <input type="submit" value="Create" class="ca-switch-to-login-view">
    </form>
    <p @click="switchToLoginView" class="ca-switch-to-login-view">Log in instead</p>
</template>

<style>
.ca-switch-to-login-view {
    margin: 0.25em;
    padding: 0.25em;
    border: 0.15em solid #000;
    background-color: #fff;
    border-radius: 0.25em;
    text-align: center;
}

.ca-error-msg {
    color: red;
}
</style>
