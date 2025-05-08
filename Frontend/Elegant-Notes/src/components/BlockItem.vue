<script>
import markdownParser from '@/markdownParser.js'

export default {
    emits: [
        'update-block',
        'block-selected',
    ],
    props: {
        block: Object,
        level: Number,
    },
    data() {
        return {
            editing: false,
            editableContent: this.block.content,
            input: undefined,
        }
    },
    computed: {
        convertedToHTML() {
            return markdownParser.render(this.editableContent)
        }
    },
    methods: {
        startEditing() {
            this.editing = true
            this.$nextTick(() => {
                this.input?.focus()
            })
        },
        saveEdit() {
            this.editing = false
            this.block.content = this.editableContent
            this.$emit('update-block', this.block)
        },
        updateChild(childBlock) {
            const index = this.block.children.findIndex(child => child.id === childBlock.id)
            if (index > -1) {
                this.block.children[index] = childBlock
            }
        },
    },
}
</script>

<template>
    <div
      class="block-item-wrapper"
      :style="{ marginLeft: ((level * 20) + 'px') }">

        <!-- Markdown renderer and inline text editing -->
        <input
          v-if="editing"
          v-model="editableContent"
          @blur="saveEdit"
          @keydown.enter="saveEdit"
          ref="input"
        />
        <div
          v-else
          class="block-item-converted-text"
          v-html="convertedToHTML"
          @click="startEditing"
          @dblclick="startEditing">
        </div>

        <!-- Children as a nested list -->
         <BlockItem
           v-for="child in block.children"
           :key="child.id"
           :block="child"
           :level="level + 1"
           @update-block="updateChild">
        </BlockItem>
    </div>
</template>

<style>
.block-item-wrapper {
    padding: 0;
}

.block-item-converted-text {
    margin: 0;
    padding: 0;
}
</style>
