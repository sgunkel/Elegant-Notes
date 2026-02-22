<script>

export default {
    props: {
        pageReferences: Object
    },
    data() {
        return {
            // everything we need is in the props
        }
    },
    mounted() {
        console.log('mounted backlink editor with data:', this.pageReferences)
    },
}
</script>

<template>
    <!-- TODO add editing functionality -->
    <h2>{{ pageReferences.ref.page_name }}</h2>
    <p>{{ pageReferences.blockOfInterest.content }}</p>
    <textarea style="width: 100%; height: 100%;">{{ JSON.stringify(pageReferences, null, 2) }}</textarea>
</template>

<style>
.br-text {
    white-space: pre-wrap;
}
</style>
