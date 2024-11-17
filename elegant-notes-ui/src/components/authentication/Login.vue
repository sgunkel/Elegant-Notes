<script>
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
            const formData = new FormData()
            formData.append('username', this.username)
            formData.append('password', this.password)
            const request = {
                body: formData,
                method: 'POST'
            }
            fetch('/user/token', request)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                if (data.detail) {
                    this.error = data.detail
                }
                else {
                    this.$emit('gotToken', data)
                }
            })
            .catch(error => {
                this.error = `Unexpected error: ${error}`
            })
        }
    }
}
</script>

<template>
    <h2>Login</h2>
    <h3 v-if="error">{{ error }}</h3>
    <form @submit.prevent="submitForm">
        <label for="username">Username</label>
        <input type="text" name="username" id="username" v-model="username">
        <label for="password">Password</label>
        <input type="password" name="password" id="password" v-model="password">
        <input type="submit" value="Submit">
    </form>
    <p @click="switchToAccountView">Create account</p>
</template>

<style>
</style>
