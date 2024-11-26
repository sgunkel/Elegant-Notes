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
        pageClicked(pageObj) {
            this.$emit('pageSelected', pageObj)
        }
    }
}
</script>

<template>
    <h1>page list</h1>
    <div v-for="page in pages">
        <h3 @click="pageClicked(page)">{{ page }}</h3>
    </div>
</template>

<style>
</style>
