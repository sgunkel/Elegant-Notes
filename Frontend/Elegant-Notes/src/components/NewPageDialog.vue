<script>
import { router } from '@/router/routes.js'
import { store } from '@/store.js'
import { pageOperations } from '@/helpers/pageFetchers.js'

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
            pageOperations.createPage(data, (errorMsg) => this.error = errorMsg)
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
    <div class="npd-wrapper">
        <h1>{{ error }}</h1>
        <input type="text" class="page-name-text-entry" v-model="pageName">
        <p @click="createNewPage()" class="create-page-btn">create page</p>
        <p @click="cancel()" class="cancel-btn">Cancel</p>
    </div>
</template>

<style>
.npd-wrapper {
    padding: 0;
}

.page-name-text-entry,
.create-page-btn,
.cancel-btn {
    padding: 0;
}
</style>
