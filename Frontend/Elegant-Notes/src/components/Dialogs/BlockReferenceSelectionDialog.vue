<script>
import { Combobox, ComboboxOption, ComboboxOptions, TransitionRoot } from '@headlessui/vue'

const dialogMargin = 8

export default {
    components: {
        Combobox,
        ComboboxOption,
        ComboboxOptions,
        TransitionRoot,
    },
    props: {
        componentRect: Object, // The BaseEditor component we'll position above or below (depending on its position in the viewport)
        hasFocus: Boolean,
        searchResults: Array,
    },
    emits: [
        'reference-selected',
    ],
    data() {
        return {
            lastKnownComponentPosition: null
        }
    },
    computed: {
        styles() {
            if (!this.componentRect) {
                console.log('Editor to display reference results not found or given')
                return {}
            }

            const spaceBelow = window.innerHeight - this.componentRect.bottom
            const spaceAbove = this.componentRect.top
            const shouldHoverBelow = spaceBelow >= spaceAbove
            this.lastKnownComponentPosition = {
                position: 'fixed',
                top: (shouldHoverBelow
                    ? `${this.componentRect.bottom + dialogMargin}px`
                    : 'auto'),
                bottom: (shouldHoverBelow
                    ? 'auto'
                    : `${window.innerHeight - this.componentRect.top + dialogMargin}px`),
                left: `${this.componentRect.left}px`,
                width: `${this.componentRect.width}px`,
            }
            return this.lastKnownComponentPosition
        },
    },
    methods: {
        ///
        /// Handlers
        ///

        handleReferenceSelected(reference) {
            this.$emit('reference-selected', reference)
        },
    }
}
</script>

<template>
    <Teleport to="body">
        <div v-show="hasFocus" class="fixed brsd-wrapper" :style="styles">
            <Combobox @update:model-value="handleReferenceSelected">
                <ComboboxOptions static class="brsd-results-popup">
                    <ComboboxOption
                      v-for="result in searchResults"
                      :key="result.id"
                      :value="result"
                      class="brsd-result-item"
                      v-slot="{ active }">
                        <div :class="{ active }">
                            {{ result.text }}
                        </div>
                    </ComboboxOption>
                </ComboboxOptions>
            </Combobox>
        </div>
    </Teleport>
</template>

<style>
.brsd-wrapper {
    z-index: 1000;
    padding: 0;
}

.brsd-results-popup {
    border: 1px solid #ccc;
    background: white;
    max-height: min(40vh, 320px);
    overflow-y: auto;
}

.brsd-result-item {
    padding: 6px;
    cursor: pointer;
}

.brsd-result-item .active {
    background: #eee;
}
</style>
