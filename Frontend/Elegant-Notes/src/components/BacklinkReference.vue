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
}
</script>

<template>
    <h2>{{ pageReferences.page_name }}</h2>
    <div v-for="child in pageReferences.references">
        <div>{{ child.line }}</div>
        <div
          v-for="nestedChild in child.children"
          class="br-text">
            {{ nestedChild }}
        </div>
        <hr>
    </div>
</template>

<style>
.br-text {
    white-space: pre-wrap;
}
</style>
