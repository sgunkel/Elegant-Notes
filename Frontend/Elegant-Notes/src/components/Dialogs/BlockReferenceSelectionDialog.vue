<script>
import { Combobox, ComboboxOption, ComboboxOptions, TransitionRoot } from '@headlessui/vue'

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
                console.log('Editor to display reference results not found or given') // might turn into a notification with a nicer message later
                return {}
            }

            const margin = 8
            const hoverBelow = this.componentRect.bottom + 200 < window.innerHeight
            // TODO change the `px` units to `em` once we go to a production UI
            this.lastKnownComponentPosition = {
                position: 'absolute',
                top: (hoverBelow
                    ? `${this.componentRect.bottom + margin}px`
                    : `${this.componentRect.top - margin}px`),
                left: `${this.componentRect.left}px`,
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
    padding: 0;
}

.brsd-results-popup {
  border: 1px solid #ccc;
  background: white;
}

.brsd-result-item {
  padding: 6px;
  cursor: pointer;
}

.brsd-result-item .active {
  background: #eee;
}
</style>
