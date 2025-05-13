<script>
/**
 * Being completely honest, I've struggled with this part before with parent/child
 *   communications/updating and asked ChatGPT how it would do it. This is mostly
 *   what was suggested with a few modifications.
 */

import markdownParser from '@/markdownParser.js'

export default {
    props: {
        block: Object,
        level: Number,
        editingId: String,
    },
    emits: [
        'update-block',
        'start-editing'
    ],
    data() {
        return {
            editableContent: this.block.content,
        }
    },
    computed: {
        isEditing() {
            return this.block.id === this.editingId
        },
        convertMarkdownToHTML() {
            return markdownParser.render(this.editableContent)
        },
    },
    watch: {
        isEditing(newVal) {
            if (newVal) {
                this.$nextTick(() => this.$refs.input?.focus())
            }
        }
    },
    methods: {
        startEditing() {
            this.$emit('start-editing', this.block.id)
        },
        onBlur() {
            this.$emit('update-block', {
                ...this.block,
                content: this.editableContent
            })
        }
    }
}
</script>

<template>
    <div
      class="block-editor-wrapper"
      :style="{ marginLeft: ((level * 20) + 'px') }">

        <!-- Markdown renderer and inline text editing -->
        <input
          v-if="isEditing"
          v-model="editableContent"
          @blur="onBlur"
          @keydown.enter="onBlur"
          ref="input"/>
        <div
          v-else
          v-html="convertMarkdownToHTML"
          class="block-editor-converted-text"
          @click="startEditing">
        </div>

        <!-- Children as a nested list -->
        <BlockEditor
          v-for="child in block.children"
          :key="child.id"
          :block="child"
          :editing-id="editingId"
          :level="(level + 1)"
          @start-editing="$emit('start-editing', $event)"
          @update-block="$emit('update-block', $event)"/>
    </div>
</template>

<style>
.block-editor-wrapper {
    padding: 0;
    margin: 0;
}

.block-editor-converted-text {
    padding: 0;
}
</style>
