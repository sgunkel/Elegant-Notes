<script>
import { router } from '@/routes'
import { store } from '@/store.js'
import { fetchWithToken } from '@/utils.js'

export default {
    emits: [
        'cancel',
    ],
    data() {
        return {
            pageName: '',
            error: '',
        }
    },
    methods: {
        createNewPage() {
            if (this.pageName === '') {
                this.error = 'Enter page name'
                return;
            }

            const data = {
                name: this.pageName
            }
            fetchWithToken('/page/create', data, 'POST')
                .then(response => this.error = response)
            // TODO figure out how to detect if this fails
            store.setPage({name: this.pageName, content: ''})
            router.push('/page-content')
        },
        cancel() {
            this.pageName = ''
            this.$emit('cancel')
        }
    }
}
</script>

<template>
    <h1>{{ error }}</h1>
    <input type="text" v-model="pageName">
    <p @click="createNewPage()">create page</p>
    <p @click="cancel()">Cancel</p>
</template>

<style>
</style>
