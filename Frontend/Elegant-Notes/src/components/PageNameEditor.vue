<script>
import { v4 as uuidv4 } from 'uuid'

export default {
    props: {
        pageName: String,
        editingID: Number,
    },
    emits: [
        'request-focus',
        'update-requested',
        'delete-title-requested',
        'go-to-first-Block',
    ],
    data() {
        return {
            pageID: uuidv4(), // Page objects do not have an actual ID, so we just generate
                              //   one and assign `editingID` to it to prevent a BlockEditor
                              //   from taking focus while editing the Page name
            editablePageName: this.pageName,
            focusEditMode: false,
            showFocus: false,
        }
    },
    computed: {
        isEditing() {
            console.log('this.pageID === this.editingId', this.pageID === this.editingId)
            return this.focusEditMode && this.pageID === this.editingId
        },
    },
    watch: {
        pageName(newValue) {
            this.editablePageName = newValue
        },
        isEditing(newValue) {
            if (newValue) {
                this.deferFocusUntilReady();
                this.focusEditMode = true
            }
        },
        editingId(newID) {
            this.showFocus = (newID === this.pageID)
            console.log('changed edit id - edit Page name?', this.showFocus)
        }
    },
    methods: {
        deferFocusUntilReady(retries = 5) {
            this.$nextTick(() => {
                requestAnimationFrame(() => {
                    const input = this.$refs.input;
                    if (input && typeof input.focus === 'function') {
                        input.focus();
                        input.selectionStart = input.selectionEnd = input.value.length;
                        console.log('[PageNameEditor] Focused input:', this.pageID);
                    } else if (retries > 0) {
                        setTimeout(() => this.deferFocusUntilReady(retries - 1), 50);
                    } else {
                        console.error('[PageNameEditor] Failed to focus input after retries:', this.pageID);
                    }
                });
            });
        },
        requestEditMode() {
            this.focusEditMode = true
            this.$emit('request-focus', this.pageID)
        },
        requestBlur() {
            this.focusEditMode = false
        },
        onInputKeydown(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                this.$emit('go-to-first-Block')
            }
            else if (e.key === 'ArrowUp' || e.key === 'Enter') {
                e.preventDefault()
                this.$emit('update-requested')
            }
            else if (e.key === 'Backspace') {
                e.preventDefault()
                if (this.pageName === '') {
                    this.$emit('delete-title-requested')
                }
            }
        },
        handleTabs() {
            this.$emit('update-requested')
        },
    },
}
</script>

<template>
    <input
      v-if="showFocus"
      v-model="editablePageName"
      @blur="requestBlur"
      @keydown="onInputKeydown"
      @keydown.tab.exact="handleTabs"
      @keydown.shift.tab="handleTabs"
      ref="input"/>
    <h2
      v-else
      @click="requestEditMode">
        {{ editablePageName }}
    </h2>
</template>

<style>
</style>
