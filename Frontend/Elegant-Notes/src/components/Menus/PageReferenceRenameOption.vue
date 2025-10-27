<script>
/**
 * Option to replace the reference in a file during the Page Rename action.
 */

 export default {
    props: {
        id: String,
        pageName: String,
        shouldRename: Boolean,
    },
    emits: [
        'renameReferenceOptionChanged',
    ],
    data() {
        return {
            checkboxState: true,
        }
    },
    mounted() {
        this.checkboxState = this.shouldRename
    },
    watch: {
        checkboxState(newVal) {
            this.$emit('renameReferenceOptionChanged', this.id, newVal)
        },
    }
}

</script>

<template>
    <div class="prro-wrapper">
        <div class="prro-page-name">
            {{ pageName }}
        </div>
        <div class="prro-checkbox">
            <input type="checkbox" v-model="checkboxState">
        </div>
    </div>
</template>

<style>
.prro-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0 .75em;
}

.prro-page-name {
    padding: 0;
}

.prro-checkbox {
    padding: 0;
}
</style>
