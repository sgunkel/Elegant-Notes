<script>
/**
 * Block editor with Markdown display.
 */

import BaseEditor from './BaseEditor.vue';

import markdownParser from '@/markdownParser.js'

export default {
    components: {
        BaseEditor,
    },
    props: {
        blockObj: Object,
        editingID: String,
        indentionLevel: Number,
        refocusKey: Number,
    },
    emits: [
        'request-blur',
        'request-focus',
        'request-indent',
        'request-outdent',
        'request-block-update',
        'request-delete-block',
        'request-create-block',
        'request-navigate-up',
        'request-navigate-down',
    ],
    data() {
        return {
            editableContent: this.blockObj.content,
        }
    },
    computed: {
        isEditing() {
            return this.blockObj.id === this.editingID
        },
    },
    methods: {
        MarkdownToHTML(content) {
            return markdownParser.render(content)
        },

        ///
        /// Handlers
        ///

        handleBlockUpdate(newText) {
            console.log(new Date().toLocaleString(), 'block update', this.blockObj.id, newText)
            this.editableContent = newText
            const newBlock = {
                ...this.blockObj,
                content: newText,
            }
            this.relayBlockUpdate(newBlock, this.isEditing)
        },
        handleBlurRequest() {
            this.relayBlurRequest(this.blockObj.id, this.editableContent)
        },
        handleIndentRequest() {
            this.relayIndentRequest(this.blockObj.id, this.editableContent)
        },
        handleOutdentRequest() {
            this.relayOutdentRequest(this.blockObj.id, this.editableContent)
        },
        handleNavigateUpRequest() {
            this.relayNavigateUpRequest(this.blockObj.id)
        },
        handleNavigateDownRequest() {
            this.relayNavigateDownRequest(this.blockObj.id)
        },
        handleFocusRequest() {
            this.relayFocusRequest(this.blockObj.id)
        },
        handleBlockDeleteRequest() {
            // Deleting an object with children also deletes the children - so don't do it!
            if (this.blockObj.children.length === 0) {
                this.handleNavigateDownRequest() // Focus the next Block
                // TODO do we want to focus the Block below or above us?

                this.relayBlockDeleteRequest(this.blockObj.id)
            }
        },
        handleNewBlockRequest() {
            this.relayNewBlockRequest(this.blockObj.id)
        },

        ///
        /// Relays
        ///

        relayBlockUpdate(newBlock, shouldFocus) {
            this.$emit('request-block-update', newBlock, shouldFocus)
        },
        relayBlurRequest(blockID, finalText) {
            this.$emit('request-blur', blockID, finalText)
        },
        relayIndentRequest(blockID, latestText) {
            this.$emit('request-indent', blockID, latestText)
        },
        relayOutdentRequest(blockID, latestText) {
            this.$emit('request-outdent', blockID, latestText)
        },
        relayNavigateUpRequest(blockID) {
            this.$emit('request-navigate-up', blockID)
        },
        relayNavigateDownRequest(blockID) {
            this.$emit('request-navigate-down', blockID)
        },
        relayFocusRequest(blockID) {
            this.$emit('request-focus', blockID)
        },
        relayBlockDeleteRequest(blockID) {
            this.$emit('request-delete-block', blockID)
        },
        relayNewBlockRequest(blockID) {
            this.$emit('request-create-block', blockID)
        },
    },
}
</script>

<template>
    <div
      class="be-wrapper"
      :style="{ marginLeft: ((indentionLevel * 20) + 'px') }">

        <div class="be-text-line">
            <div class="be-info">
                <!-- TODO add menu for copying Block ID to clipboard -->
            </div>

            <base-editor
              :key="blockObj.id"
              :editing-id="editingID"
              :rootObjID="blockObj.id"
              :readonly-text="blockObj.content"
              :textToHTMLFunction="MarkdownToHTML"
              @update-text="handleBlockUpdate"
              @blur-requested="handleBlurRequest"
              @indent-requested="handleIndentRequest"
              @outdent-requested="handleOutdentRequest"
              @focus-for-edit-request="handleFocusRequest"
              @navigate-up-requested="handleNavigateUpRequest"
              @delete-object-requested="handleBlockDeleteRequest"
              @navigate-down-requested="handleNavigateDownRequest"
              @create-new-object-requested="handleNewBlockRequest"
            />

            <div>
                <!-- TODO add reference information (# references with a dialog that shows all references when clicked)-->
            </div>
        </div>

        <block-editor
          v-for="child in blockObj.children"
          :key="child.id"
          :block-obj="child"
          :editingID="editingID"
          :indention-level="(indentionLevel + 1)"
          :refocus-key="refocusKey"
          @request-blur="relayBlurRequest"
          @request-focus="relayFocusRequest"
          @request-indent="relayIndentRequest"
          @request-outdent="relayOutdentRequest"
          @request-block-update="relayBlockUpdate"
          @request-create-block="relayNewBlockRequest"
          @request-navigate-up="relayNavigateUpRequest"
          @request-navigate-down="relayNavigateDownRequest"
          @request-delete-block="relayBlockDeleteRequest"
        />
    </div>
</template>

<style>
.be-wrapper {
    padding: 0;
    margin: 0;
}

.be-text-line {
    display: flex;
    flex-direction: row;
    margin: 0;
    width: 100%;
}

.be-text-edit {
    width: 100%;
    flex: 1 1 0;
}

.be-info {
    background-color: red;
    padding: 0.25em;
}

.be-converted-text {
    padding: 0;
    width: 100%;
}
</style>
