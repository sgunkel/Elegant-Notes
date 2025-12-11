<script>
import { store } from '@/store.js';
import { authUtils } from '@/helpers/authUtils.js'

export default {
    data() {
        return {
            errorMessages: [],
            name: '',
            username: '',
            password: '',
        }
    },
    methods: {
        submitRegistration() {
            this.errorMessages = []
            if (this.username === '') {
                this.errorMessages.push('Username is required')
            }
            if (this.password === '') {
                this.errorMessages.push('Password is required')
            }
            if (this.name === '') {
                this.errorMessages.push('Full name required')
            }
            
            if (this.errorMessages.length === 0) {
                authUtils.sendRegistrationForm(this.name, this.username, this.password,
                    this.successfulRegistration, this.errorWithRegistration)
            }
        },
        successfulRegistration(data) {
            if (data.access_token && data.token_type) {
                store.setJWTToken(data)
            }
            else if (data.detail) {
                this.errorMessages = (data.detail[0].msg) ?
                    (data.detail.map(x => x.msg) || ['Could not parse error message(s)']) :
                    [data.detail]
            }
            else {
                this.errorWithRegistration(data)
            }
        },
        errorWithRegistration(msg) {
            console.log('failure')
            console.log(msg)
            this.errorMessages = [msg]
        },
    }
}
</script>

<template>
    <div class="ruv-wrapper">
        <h2>New Account</h2>
        <div class="ruv-error-msg-banner">
            <span
            class="error-msg-text"
            v-for="msg in this.errorMessages">
                {{ msg }}
            </span>
        </div>
        <form @submit.prevent="submitRegistration" method="POST">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" v-model="username" class="username-field">

            <label for="password">Password</label>
            <input type="password" id="password" name="password" v-model="password" class="password-field">

            <!-- TODO add second password field for confirmation -->

            <label for="full_name">Full Name</label>
            <input type="text" id="full_name" name="full_name" v-model="name" class="full-name-field">

            <input type="submit" value="Submit" class="submit-btn">
        </form>
    </div>
</template>

<style>
.ruv-wrapper {
    padding: 0;
}

.ruv-error-msg-banner {
    padding: 0.5em;
}

.error-msg-text {
    padding: 0;
}

/* Mainly used for testing */
.username-field,
.password-field,
.full-name-field,
.submit-btn {
    padding: 0;
}
</style>
