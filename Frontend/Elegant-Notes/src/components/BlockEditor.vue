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
        'delete-block',
        'indent-block',
        'outdent-block',
    ],
    data() {
        return {
            editableContent: this.block.content,
            tabbing: false,
            keepFocusOnBlock: false,
        }
    },
    mounted() {
        if (this.isEditing) {
            // this.tabbing = true
            this.keepFocusOnBlock = true
            this.deferFocusUntilReady();
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
                // this.deferFocus();
                this.deferFocusUntilReady();
                this.keepFocusOnBlock = true
            }
        },
        refocusKey() {
            if (this.isEditing) {
                this.deferFocus()
            }
        },
        editableContent(newVal) {
            console.log('Block', this.block.id, 'content changed to:', newVal)
        },
        // 'block.content'(newContent) {
        //     this.editableContent = newContent
        // },
    },
    methods: {
        focusInput() { // not used....
            console.log('focusInput on id', this.block.id)
            this.$nextTick(() => {
                this.$refs.input?.focus()
                console.log('set focus via $refs')
            });
        },
        startEditing() {
            this.keepFocusOnBlock = true
            this.$emit('start-editing', this.block.id)
        },
        saveBlockState(keepFocus, shouldDebounce = true) {
            keepFocus ??= false
            console.log('saveBlockState - keepFocus:', keepFocus)
            this.$emit('update-block', {
                ...this.block,
                content: this.editableContent
            }, keepFocus, shouldDebounce)
        },
        onBlur() {
            console.log('onBlur - tabbing:', this.tabbing)
            this.keepFocusOnBlock = false
            // if (this.tabbing) {
            //     this.tabbing = false
            //     // this.focusInput()
            // }
            // else {
            //     this.saveBlockState()
            // }
            this.saveBlockState(this.tabbing ?? false)
        },
        onInputKeydown(e) {
            console.log('onInputKeydown: `' + e.key + '`')
            console.log('this.tabbing', this.tabbing)
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.$emit('navigate', 'down')
                this.keepFocusOnBlock = false
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault()
                this.$emit('navigate', 'up')
                this.keepFocusOnBlock = false
            }
            else if (e.key === 'Enter') {
                e.preventDefault()
                this.onBlur()
                this.$emit('create-block-after', this.block.id)
                this.keepFocusOnBlock = false
            }
            else if (e.key === 'Backspace') {
                if (this.editableContent === '' && this.block.children.length === 0) {
                    this.$emit('navigate', 'down')
                    this.$emit('delete-block', this.block.id)
                }
            }
        },
        handleTab() {
            this.tabbing = true
            // this.keepFocusOnBlock = false
            console.log('handleTab editableContent', this.editableContent)
            this.$emit('indent-block', this.block.id, this.editableContent)
            // this.saveBlockState(true)
        },
        handleShiftTab() {
            this.tabbing = true
            // this.saveBlockState(true, true)
            // this.keepFocusOnBlock = false
            console.log('handleShiftTab editableContent', this.editableContent)
            this.$emit('outdent-block', this.block.id, this.editableContent)
        },
        deferFocus() {
            // console.log("Focusing:", this.block.id)
            // // Only run when it switches to true
            // this.$nextTick(() => {
            //     requestAnimationFrame(() => {
            //         const el = this.$refs.input;
            //         if (el && typeof el.focus === 'function') {
            //             setTimeout(() => {
            //                 el.focus();
            //                 el.selectionStart = el.selectionEnd = el.value.length;
            //             }, 0);
            //         } else {
            //             console.warn('[BlockEditor] Input not focusable for block', this.block.id);
            //         }
            //     });
            // });

              console.log("Deferred focus:", this.block.id)
                this.$nextTick(() => {
                    requestAnimationFrame(() => {
                    const el = this.$refs.input;
                    if (el && typeof el.focus === 'function') {
                        el.focus();
                        // Move cursor to end
                        el.selectionStart = el.selectionEnd = el.value.length;
                        el.style.outline = '2px solid red'; // debug
                    } else {
                        console.warn('[BlockEditor] Input not focusable for block', this.block.id);
                    }
                    this.tabbing = false
                });
            });
        },
        deferFocusUntilReady(retries = 5) {
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    const input = this.$refs.input;
                    if (input && typeof input.focus === 'function') {
                        input.focus();
                        input.selectionStart = input.selectionEnd = input.value.length;
                        input.style.outline = '2px solid red'; // for debugging
                        console.log('[BlockEditor] Focused input:', this.block.id);
                    } else if (retries > 0) {
                        console.warn('[BlockEditor] Retrying focus for block', this.block.id);
                        setTimeout(() => this.deferFocusUntilReady(retries - 1), 50);
                    } else {
                        console.error('[BlockEditor] Failed to focus input after retries:', this.block.id);
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
          @keyup="saveBlockState(this.keepFocusOnBlock)"
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
          :refocus-key="refocusKey"
          @start-editing="$emit('start-editing', $event)"
          @update-block="$emit('update-block', $event)"
          @navigate="$emit('navigate', $event)"
          @create-block-after="$emit('create-block-after', $event)"
          @delete-block="$emit('delete-block', $event)"
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
