<script>
import { store } from '@/store.js'
import { authUtils } from '@/helpers/authUtils.js'

export default {
    data() {
        return {
            store,
            errorMessages: '',
            username: '',
            password: '',
        }
    },
    methods: {
        async submitForm() {
            authUtils.sendLoginForm(this.username, this.password,
                this.successCallback,
                this.errorCallback)
        },
        successCallback(token) {
            if (token.access_token && token.token_type) {
                store.setJWTToken(token)
            }
            else if (token.detail) {
                this.errorMessages = (token.detail[0].msg) ?
                    (token.detail.map(x => x.msg) || ['Could not parse error message(s)']) :
                    [token.detail]
            }
            else {
                this.errorMessages = [token]
            }
        },
        errorCallback(error) {
            this.errorMessages = [error]
        }
    }
}
</script>

<template>
    <div>login</div>
    <h3 v-if="errorMessages">
        <span v-for="msg in this.errorMessages">{{ msg }}</span>
    </h3>
    <form @submit.prevent="submitForm">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" v-model="username" required>
        <label for="password">Password</label>
        <input type="password" name="password" id="password" v-model="password" required>
        <input type="submit" value="Submit">
    </form>
</template>

<style>

</style>
