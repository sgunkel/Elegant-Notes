<script>

export default {
    props: {
        pages: []
    },
    emits: [
        'pageSelected',
    ],
    data() {
        return {
            //
        }
    },
    methods: {
        pageClick(pageObj) {
            this.$emit('pageSelected', pageObj)
        }
    }
}
</script>

<template>
    <h1>page list</h1>
    <div v-for="page in pages">
        <h3 @click="pageClick(page)">{{ page }}</h3>
    </div>
</template>

<style>
</style>
