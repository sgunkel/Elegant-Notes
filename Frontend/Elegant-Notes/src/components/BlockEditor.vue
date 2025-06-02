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
        refocusKey: Number,
    },
    emits: [
        'update-block',
        'start-editing',
        'navigate',
        'create-block-after',
        'indent-block',
        'outdent-block',
    ],
    data() {
        return {
            editableContent: this.block.content,
        }
    },
    mounted() {
        if (this.isEditing) {
            this.focusInput();
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
                this.deferFocus();
            }
        },
        // refocusKey() {
        //     if (this.editingId) {
        //         this.deferFocus()
        //     }
        // }
    },
    methods: {
        focusInput() {
            console.log(this.block.id)
            this.$nextTick(() => this.$refs.input?.focus());
        },
        startEditing() {
            this.$emit('start-editing', this.block.id)
        },
        saveBlockState() {
            this.$emit('update-block', {
                ...this.block,
                content: this.editableContent
            })
        },
        onBlur() {
            this.saveBlockState()
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
        handleTab() {
            this.saveBlockState()
            this.$emit('indent-block', this.block.id)
        },
        handleShiftTab() {
            this.saveBlockState()
            this.$emit('outdent-block', this.block.id)
        },
        deferFocus() {
            console.log("Focusing:", this.block.id)
            // Only run when it switches to true
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                const el = this.$refs.input;
                if (el && typeof el.focus === 'function') {
                    // Small timeout ensures focus works even in Firefox
                    setTimeout(() => {
                    el.focus();
                    el.selectionStart = el.selectionEnd = el.value.length;
                    }, 0);
                } else {
                    console.warn('[BlockEditor] Input not focusable for block', this.block.id);
                }
                });
            });
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
          @keydown.tab.exact="handleTab"
          @keydown.shift.tab="handleShiftTab"
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
          @indent-block="$emit('indent-block', $event)"
          @outdent-block="$emit('outdent-block', $event)"
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
