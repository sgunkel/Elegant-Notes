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
            authUtils.sendRegistrationForm(this.name, this.username, this.password,
                this.successfulRegistration, this.errorWithRegistration)
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
        <input type="text" id="username" name="username" v-model="username" required>

        <label for="password">Password</label>
        <input type="password" id="password" name="password" v-model="password" required>

        <label for="full_name">Full Name</label>
        <input type="text" id="full_name" name="full_name" v-model="name" required>

        <input type="submit" value="Submit">
    </form>
</template>

<style>
.ruv-error-msg-banner {
    padding: 0.5em;
}

.error-msg-text {
    padding: 0;
}
</style>
