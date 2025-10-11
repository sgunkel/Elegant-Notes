<script>
/**
 * Page rename confirmation dialog
 */

 export default {
    props: {
        oldPageName: String,
        newPageName: String,
    },
    emits: [
        'renameConfirmed',
        'renameCancelled',
    ],
    data() {
        return {
            //
        }
    },
    methods: {
        renamePage() {
            this.$emit('renameConfirmed')
        },
        renameCancelled() {
            this.$emit('renameCancelled')
        },
    }
 }

</script>

<template>
    <div class="prd-wrapper">
        <h2>{{ oldPageName }} -> {{ newPageName }}</h2>
        <div class="prd-confirmation-btns">
            <div class="prd-confirm-btn" @click="renamePage">Yes</div>
            <div class="prd-confirm-btn" @click="renameCancelled">No</div>
        </div>

        <!-- Future: show a list showing all references (backlinks) to be updated with the option to update each one or not -->
    </div>
</template>

<style>
.prd-wrapper {
    display: flex;
    flex-direction: column;
}
.prd-confirmation-btns {
    display: flex;
    flex-direction: column;
}

.prd-confirm-btn {
    padding: 0;
}
</style>
