<script>
/**
 * Being completely honest, I've struggled with this part before with parent/child
 *   communications/updating and asked ChatGPT how it would do it. A lot the concepts
 *   were generated from ChatGPT but the actual code usually had modifications to it.
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
        'start-editing',
        'navigate',
        'create-block-after',
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
        focusInput() {
            this.$nextTick(() => this.$refs.input?.focus());
        },
        startEditing() {
            this.$emit('start-editing', this.block.id)
        },
        onBlur() {
            this.$emit('update-block', {
                ...this.block,
                content: this.editableContent
            })
        },
        onInputKeydown(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.$emit('navigate', 'down')
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault()
                this.$emit('navigate', 'up')
            }
            else if (e.key === 'Enter') {
                e.preventDefault()
                this.onBlur()
                this.$emit('create-block-after', this.block.id)
            }
        },
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
          :key="block.id"
          v-model="editableContent"
          @blur="onBlur"
          @keydown="onInputKeydown"
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
          @update-block="$emit('update-block', $event)"
          @navigate="$emit('navigate', $event)"
          @create-block-after="$emit('create-block-after', $event)"
          />
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
