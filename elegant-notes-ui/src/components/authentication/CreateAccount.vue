<script>
export default {
    emits: [
        'gotToken'
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
        createFormRequest() {
            const formData = new FormData()
            formData.append('username', this.username)
            formData.append('password', this.password)
            formData.append('full_name', this.fullName)
            return {
                body: formData,
                method: 'POST'
            }
        },
        async sendFormRequest() {
            let signInWithAccount = false
            const payload = this.createFormRequest()
            await fetch('/user/add', payload)
              .then(response => response.json())
              .then(data => {
                if (data.detail) {
                    this.errorMessage = data.detail
                }
                else if (data.status) {
                    signInWithAccount = true
                    console.log(data)
                }
                else {
                    this.errorMessage = `Unknown response from server: ${data}`
                }
                console.log('done!')
              })
              .catch(error => {
                this.errorMessage = error
              })
            console.log('now try it')
            console.log(signInWithAccount)
            if (signInWithAccount) {
                this.signInAndEmit()
            }
        },
        signInAndEmit() {
            const formRequest = this.createFormRequest()
            fetch('/user/token', formRequest)
              .then(response => response.json())
              .then(data => {
                console.log(data)
                this.$emit('gotToken', data)
              })
              .catch(error => {
                this.errorMessage = `Unexpected error: ${error}`
              })
        }
    }
}
</script>

<template>
    <h2>Create Account</h2>
    <h3 v-if="errorMessage !== ''">{{ errorMessage }}</h3>
    <form @submit.prevent="sendFormRequest" method="POST">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" v-model="username">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" v-model="password">
        <label for="full_name">Full Name</label>
        <input type="text" id="full_name" name="full_name" v-model="fullName">
        <input type="submit" value="Submit">
    </form>
</template>

<style>
</style>
