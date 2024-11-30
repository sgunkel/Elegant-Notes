<script>
import { constants } from '@/constants.js';
import { store } from '@/store.js';
import { nextTick, ref } from 'vue';

export default {
    props: {
        block: Object,
        parent: Object,
        atRoot: Boolean,
    },
    emits: [
        'removeChild',
        'addChild',
    ],
    data() {
        return {
            // state is created and given to us from setup()
            previousText: this.block.text,
            children: [],
        }
    },
    setup() {
        /*
         * Vue3 makes this portion a little hacky, but this is how we can set the
         *   input focused states per component; since this component has several
         *   instances, it's slightly trickier to grab the correct <input> node.
         * https://laracasts.com/discuss/channels/vue/how-to-set-focus-on-a-newly-shown-input-element
        */
        const focused = ref(false)
        const textInput = ref(null) // some dark magic will assign this to the <input> component with ref="textInput"...
        const setFocus = () => {
            nextTick(() => {
                textInput.value.focus()
            })
        }
        return {
            focused,
            textInput,
            setFocus
        }
    },
    mounted() {
        this.children = this.block.children
    },
    methods: {
        enterEditMode() {
            this.focused = true
            this.setFocus()
        },
        enterPresentationMode() {
            this.focused = false
            this.saveChanges()
        },
        saveChanges() {
            const convertObjToFormat = (obj) => {
                return {
                    ID: obj['@id'],
                    parent_id: obj.parent_id,
                    text: obj.text,
                    children: obj.children.map(child => convertObjToFormat(child))
                }
            }
            const objWithChildIDs = convertObjToFormat(this.block)
            store.fetchFromServer(constants.URLs.UPDATE_BLOCK, objWithChildIDs, 'PUT')
            .then(msg => console.log(msg)) // TODO: How do we want to display success to the user, or do we?
            .catch(error => console.log(error)) // TODO: How do we display an error message about changes not going through?
        },
        handleTab(e) {
            if (e.shiftKey) {
                this.dedentBlock()
            }
            else {
                this.indentBlock()
            }
        },
        addChild(child) {
            this.children.push(child)
        },
        removeChild(child, addToParent=false) {
            const childIndex = this.block.children.indexOf(child)
            if (childIndex === -1) {
                console.log(`removeChild(): child not found (given "${child['@id']}" from options "${this.children.map(x => x['@id']).join('", "')}")`)
                return
            }
            this.block.children.splice(childIndex, 1)

            if (addToParent) {
                this.$emit('addChild', child)
            }
        },
        indentBlock() {
            const siblings = this.parent.children
            const siblingIndex = siblings.indexOf(this.block)
            if (siblingIndex === -1) {
                console.log('Could not figure out Block sibling index.')
                return
            }
            if (siblingIndex === 0) {
                // dedent..?
                return
            }
            const newParent = siblings[siblingIndex - 1]
            newParent.children.push(this.block)
            this.parent.children.splice(siblingIndex, 1)
            this.block.parent_id = newParent['@id']
        },
        dedentBlock() {
            if (!this.atRoot) {
                this.$emit('removeChild', this.block, true)
            }
        },
    }
}
</script>

<template>
    <ul class="bcv-wrapper">
        <li>
            <input
              v-if="focused"
              type="text"
              ref="textInput"
              v-model="block.text"
              @blur="enterPresentationMode"
              @keydown.tab="handleTab">
            <span
              v-else
              @click="enterEditMode">
                {{ block.text }}
            </span>
        </li>
        <BlockContentView
          v-for="child in children"
          :block="child"
          :parent="block"
          :at-root="false"
          @add-child="addChild"
          @remove-child="removeChild">
        </BlockContentView>
    </ul>
</template>

<style>
.bcv-wrapper {
    margin: 0;
}
</style>
