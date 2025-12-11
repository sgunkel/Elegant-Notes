<script>
import { store } from '@/store.js'
import { authUtils } from '@/helpers/authUtils.js'

export default {
    data() {
        return {
            store,
            errorMessages: [''],
            username: '',
            password: '',
        }
    },
    methods: {
        async submitForm() {
            if (this.username === '' || this.password === '') {
                this.errorMessages = ['Username or password empty']
            }
            else {
                authUtils.sendLoginForm(this.username, this.password,
                    this.successCallback,
                    this.errorCallback)
            }
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
    <div class="lv-wrapper">
        <div>login</div>
        <h3 v-if="errorMessages">
            <span v-for="msg in this.errorMessages">{{ msg }}</span>
        </h3>
        <form @submit.prevent="submitForm" novalidate>
            <label for="username">Username</label>
            <input type="text" name="username" id="username" v-model="username" class="username-field">
            <label for="password">Password</label>
            <input type="password" name="password" id="password" v-model="password" class="password-field">
            <input type="submit" class="submit-btn" value="Submit">
        </form>
    </div>
</template>

<style>
.lv-wrapper {
    padding: 0;
}

/* Mainly for component testing */
.username-field,
.password-field,
.submit-btn {
    padding: 0;
}
</style>
