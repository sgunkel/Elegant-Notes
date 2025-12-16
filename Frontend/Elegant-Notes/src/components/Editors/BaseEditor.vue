<script>
import { textUtil } from '@/helpers/textUtil';

/**
 * Base functionality of text editing, including display and edit modes.
 */

export default {
    props: {
        editingId: String,              // Global object (Page or Block) being edited
        rootObjID: String,              // The ID belonging to this object (Page or Block)
        readonlyText: String,           // The text belonging to this object (Page name or Block text)
        textToHTMLFunction: Function,   // Presentation converter used in display mode
    },
    emits: [
        'update-text',                  // Text is changed (add or delete a letter or selected text)
        'blur-requested',               // User loses focus by clicking outside the editor, using arrow keys, or presses Enter/Return
        'indent-requested',             // Tab key is pressed
        'outdent-requested',            // Tab + Shift keys are pressed
        'navigate-up-requested',        // Up arrow key is pressed
        'navigate-down-requested',      // Down arrow key is pressed
        'focus-for-edit-request',       // Editor is in Presentation mode and a user clicks/presses the text to enter Edit mode
        'delete-object-requested',      // Text is empty and user pressed the Backspace/Delete key
        'create-new-object-requested',  // Enter key is pressed
        'reference-symbol-detected',    // User typed in `((` or `[[`
    ],
    data() {
        return {
            editableContent: this.readonlyText,
        }
    },
    mounted() {
        if (this.isEditing) {
            this.keepFocusOnBlock = true
            this.deferFocusUntilReady()
        }
    },
    computed: {
        isEditing() {
            return this.rootObjID === this.editingId
        },
        toPresentationHTML() {
            return this.textToHTMLFunction(this.editableContent || '&nbsp;')
        },
    },
    watch: {
        readonlyText(newVal) {
            this.editableContent = newVal
        }
    },
    methods: {

        ///
        /// Relay Handlers
        ///

        handleTabKeyEvent() {
            this.$emit('indent-requested')
        },
        handleShiftTabKeyEvent() {
            this.$emit('outdent-requested')
        },
        handleTextContentUpdate() {
            this.$emit('update-text', this.editableContent)
        },
        handleInputTagBlur() {
            this.handleTextContentUpdate()
            this.$emit('blur-requested')
        },
        requestEditMode() {
            this.$emit('focus-for-edit-request')
        },
        onInput(e) {
            const trigger = textUtil.startedReferenceOpening(e.target)
            if (trigger) {
                this.$emit('reference-symbol-detected', trigger, e)
            }
        },
        onInputKeydown(e) {
            textUtil.handleTextAutoPair(this.$refs.input, e)
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.$emit('navigate-down-requested')
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault()
                this.$emit('navigate-up-requested')
            }
            else if (e.key === 'Enter') {
                // TODO cursor position changes how we create new objects implementation
                e.preventDefault()
                this.handleInputTagBlur()
                this.$emit('create-new-object-requested')
            }
            else if (e.key === 'Backspace') {
                if (this.editableContent === '') {
                    this.$emit('delete-object-requested')
                }
            }
        },

        ///
        /// Edit/Presentation Mode Handlers
        ///

        deferFocusUntilReady(retries = 5) {
            // TODO move default retry count and timeout values to constants class
            // TODO write about Vue's timing mechanism to explain this monstrosity
            // TODO look into this more to see if we still need this awful timing mechanism
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    const input = this.$refs.input;
                    if (input && typeof input.focus === 'function') {
                        input.focus();
                        input.selectionStart = input.selectionEnd = input.value.length; // set cursor at the end (TODO do we want this or just have the cursor land naturally - or is it too difficult to implement the 'natural' way)
                    } else if (retries > 0) {
                        console.warn(`[BaseEditor] Retrying focus for object #${retries}`, this.rootObjID, `"${this.editableContent}"`);
                        setTimeout(() => this.deferFocusUntilReady(retries - 1), 50);
                    } else {
                        console.error('[BaseEditor] Failed to focus input after retries:', this.rootObjID);
                    }
                })
            })
        },
        
        getInputRect() {
            // Used for positioning the reference search box
            return this.$refs.input?.getBoundingClientRect()
        },
    }
}

</script>

<template>
    <div class="base-editor-wrapper">
        <div class="base-editor-text-line">
            <!-- Markdown renderer and inline text editing -->
            <input v-if="isEditing"
              :key="rootObjID"
              v-model="editableContent"
              class="base-editor-text-edit"
              @input="onInput"
              @blur="handleInputTagBlur"
              @keydown="onInputKeydown"
              @keyup="handleTextContentUpdate()"
              @keydown.tab.exact="handleTabKeyEvent"
              @keydown.shift.tab="handleShiftTabKeyEvent"
              ref="input"/>
            <div v-else
              v-html="toPresentationHTML"
              class="base-editor-converted-text"
              @click="requestEditMode">
            </div>
        </div>
    </div>
</template>

<style>
.base-editor-wrapper {
    padding: 0;
    margin: 0;
    width: 100%;
}

.base-editor-text-line {
    display: flex;
    flex-direction: row;
    margin: 0;
}

.base-editor-text-edit {
    width: 100%;
    flex: 1 1 0;
}

.base-editor-info {
    background-color: red;
    padding: 0.25em;
}

.base-editor-converted-text {
    padding: 0;
    width: 100%;
}
</style>
