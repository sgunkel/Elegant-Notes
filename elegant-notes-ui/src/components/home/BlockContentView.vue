<script>
export default {
    props: {
        block: Object,
    },
    data() {
        return {
            //
        }
    }
}
</script>

<template>
    <ul class="bcv-wrapper">
        <li>{{ block.text }}</li>
        <BlockContentView
          v-for="child in block.children"
          :block="child">
        </BlockContentView>
    </ul>
</template>

<style>
.bcv-wrapper {
    margin: 0;
}
</style>
