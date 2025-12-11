<script>
/**
 * Page name editor with rename confirmation dialog.
 */
import BaseEditor from './BaseEditor.vue';

const headerTag = 'h2'

export default {
    components: {
        BaseEditor,
    },
    props: {
        pageObj: Object,
        editingId: String,
    },
    emits: [
        'request-blur',
        'request-focus',
        'request-text-update',
    ],
    data() {
        return {
            newPageName: this.pageObj.name,
        }
    },
    methods: {
        htmlConverter() {
            return `<${headerTag}>${this.pageObj.name}</${headerTag}>`
        },

        ///
        /// Handlers
        ///

        handleFocusRequest() {
            this.$emit('request-focus', this.pageObj.id)
        },
        handlePageNameUpdate(newName) {
            this.newPageName = newName
        },
        handleBlurRequest() {
            this.$emit('request-blur', this.pageObj.id, this.newPageName)
        },
        handlePageNameDelete() {
            // Blur event with no change to the name cancels the operation
            this.newPageName = this.pageObj.name
            this.handleBlurRequest()
        },
    },
}

</script>

<template>
    <div>
        <base-editor
          :editing-id="editingId"
          :rootObjID="pageObj.id"
          :readonly-text="pageObj.name"
          :textToHTMLFunction="htmlConverter"
          @update-text="handlePageNameUpdate"
          @blur-requested="handleBlurRequest"
          @indent-requested="handleBlurRequest"
          @outdent-requested="handleBlurRequest"
          @navigate-up-requested="handleBlurRequest"
          @navigate-down-requested="handleBlurRequest"
          @focus-for-edit-request="handleFocusRequest"
          @delete-object-requested="handlePageNameDelete"
          @create-new-object-requested="handleBlurRequest"
        />
    </div>
</template>

<style>

</style>
