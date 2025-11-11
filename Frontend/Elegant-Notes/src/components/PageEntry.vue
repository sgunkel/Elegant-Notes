<script>
import { store } from '@/store.js'

export default {
    props: {
        page: Object,
    },
    data() {
        return {
            //
        }
    },
    methods: {
        selectPage() {
            store.setPage(this.page)
            this.$router.push('/page-editor')
        }
    }
}
</script>

<template>
    <div class="pe-background" @click="selectPage">
        <span>{{ page.name }}</span>
        <span>{{ page.creation }}</span>
        <span>{{ page.last_modified }}</span>
    </div>
</template>

<style>
.pe-background {
    display: flex;
    flex-direction: column;
    padding: 0.5em;
    border: 0.15em solid black;
    margin: 0.25em;
}
</style>
