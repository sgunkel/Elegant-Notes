<script>
import { constants } from '@/constants.js';
import { store } from '@/store.js';
import { convertBlockObjToFormat } from './shared.js';
import { nextTick, ref } from 'vue';

export default {
    props: {
        index: Number,
        block: Object,
        parent: Object,
        atRoot: Boolean,
    },
    emits: [
        'childGotFocus',
        'childLostFocus',
        'removeChild',
        'addChild',
        'focusNext',
        'focusPrevious',
    ],
    data() {
        return {
            // state is created and given to us from setup()
            previousText: this.block.text,
            focusedOnCreation: this.block.startWithFocus || false,
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
    watch: {
        block() {
            if (!this.block.editModeFn) {
                this.block.editModeFn = this.enterEditMode
            }
        },
    },
    mounted() {
        if (typeof this.block === 'string' || this.block instanceof String) {
            // Initial Page object has IDs for the children and gets updated when the
            //   full Page object is loaded; if our Block object is just a string (the
            //   ID), just ignore it
        }
        else {
            this.block.editModeFn = this.enterEditMode
        }
        if (this.focusedOnCreation) {
            this.enterEditMode()
        }
    },
    methods: {
        handleChildFocused(child=undefined) {
            if (!child) {
                child = this.block
            }
            this.$emit('childGotFocus', child)
        },
        handleChildLostFocus(child=undefined) {
            if (!child) {
                child = this.block
            }
            this.$emit('childLostFocus', child)
        },
        enterEditMode() {
            this.focused = true
            this.setFocus()
            this.handleChildFocused()
        },
        enterPresentationMode() {
            this.handleChildLostFocus()
            this.focused = false
            this.saveChanges()
        },
        saveChanges() {
            const objWithChildIDs = convertBlockObjToFormat(this.block)
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
        addChild(child, parent, startsWithFocus=false) {
            // TODO this needs to be cleaned up soon but deadlines are approaching
            child.parent_id = this.block['@id']
            if (child['@id'] === undefined) {
                store.fetchFromServer(constants.URLs.ADD_BLOCK, child, 'POST')
                  .then(result => {
                    child['@id'] = result.created['@id']
                    this.saveChanges()
                  })
            }

            if (!parent) {
                this.block.children.push(child)
                this.saveChanges()
                return
            }

            const siblingIndex = this.block.children.indexOf(parent)
            if (siblingIndex === -1) {
                console.log('could not find sibling index via parent object')
                return
            }
            child.startWithFocus = startsWithFocus
            this.block.children.splice(siblingIndex + 1, 0, child)
            this.saveChanges()
        },
        removeChild(child, childIndex, addToParent=false) {
            // TODO this needs to be cleaned up soon but deadlines are approaching
            if (addToParent) {
                // Move siblings after this Block object to be its children. This is dedenting this Block
                //   but keeping the remaining siblings at the same indention level they were before
                const siblingLength = this.block.children.length
                const nextSiblingIndex = childIndex + 1
                if (nextSiblingIndex < siblingLength) {
                    const count = siblingLength - nextSiblingIndex
                    const newChildren = this.block.children.splice(nextSiblingIndex, count)
                    child.children = child.children.concat(newChildren)
                }
                else {
                    console.log(`next sibling's index (${nextSiblingIndex}) exceeds sibling size (${siblingLength}) - copying 0 children`)
                }
                this.$emit('addChild', child, this.block)
            }
            this.block.children.splice(childIndex, 1)
            this.saveChanges()
        },
        isParentPageObject() {
            return this.parent['@id'].startsWith('Page/')
        },
        indentBlock() {
            const siblings = this.parent.children
            const siblingIndex = this.index
            const nextSiblingIndex = siblingIndex + 1
            if (siblingIndex === -1) {
                console.log('Could not figure out Block sibling index.')
                return
            }
            if (siblingIndex === 0) {
                // dedent..?
                console.log('first child indented - doing nothing')
                return
            }
            const newParent = siblings[siblingIndex - 1]
            this.block.parent_id = newParent['@id']
            newParent.children.splice(nextSiblingIndex, 0, this.block)
            this.parent.children.splice(siblingIndex, 1)
        },
        dedentBlock() {
            if (!this.isParentPageObject()) {
                this.$emit('removeChild', this.block, this.index, true)
            }
        },
        focusNextItem(currentIndex) {
            this.keyboardNavigation(currentIndex, true)
        },
        focusPreviousItem(currentIndex) {
            this.keyboardNavigation(currentIndex, false)
        },
        keyboardNavigation(currentIndex, isGoingUp) {
            const directionValue = (isGoingUp) ? -1 : 1
            const newIndex = currentIndex + directionValue
            const siblings = this.block.children
            if (newIndex > 0) {
                if (newIndex < siblings.length) {
                    const sibling = siblings[newIndex]
                    if (isGoingUp) {
                        // go to the child directly above this Block at the deepest generation level
                        const getLast = (obj) => {
                            if (obj.children.length !== 0) {
                                return getLast(obj.children[obj.children.length - 1])
                            }
                            return obj
                        }
                        getLast(sibling).editModeFn()
                    }
                    else {
                        sibling.editModeFn()
                    }
                }
                else {
                    if (isGoingUp) {
                        this.$emit('focusNext', this.index)
                    }
                    else {
                        this.$emit('focusPrevious', this.index)
                    }
                }
            }
            else {
                this.enterEditMode()
            }
        },
        handleEnter() {
            this.enterPresentationMode()
            const newChild = {
                // backend to take care of the id
                parent_id: '',
                text: '',
                children: [],
                startWithFocus: true,
            }
            this.$emit('addChild', newChild, this.block, true)
        },
        handleDelete() {
            if (this.block.text) {
                return
            }
            this.$emit('removeChild', this.block, this.index)
        },
        handleArrowUp() {
            this.enterPresentationMode()
            this.$emit('focusNext', this.index)
        },
        handleArrowDown() {
            this.enterPresentationMode()
            if (this.block.children.length === 0) {
                this.$emit('focusPrevious', this.index)
            }
            else {
                this.block.children[0].editModeFn()
            }
        },
    }
}
</script>

<template>
    <ul class="bcv-wrapper">
        <!-- This whole list item should be its own component -->
        <li>
            <input
              v-if="focused"
              type="text"
              ref="textInput"
              v-model="block.text"
              @blur="enterPresentationMode"
              @keydown.enter="handleEnter"
              @keydown.delete="handleDelete"
              @keydown.tab="handleTab"
              @keydown.up="handleArrowUp"
              @keydown.down="handleArrowDown">
            <span
              v-else
              @click="enterEditMode">
                {{ block.text || '&nbsp;' }}
            </span>
        </li>
        <BlockContentView
          v-for="(child, index) in block.children" :key="child['@id']"
          :index="index"
          :block="child"
          :parent="block"
          :at-root="false"
          @childGotFocus="handleChildFocused"
          @childLostFocus="handleChildLostFocus"
          @add-child="addChild"
          @remove-child="removeChild"
          @focusNext="focusNextItem"
          @focusPrevious="focusPreviousItem">
        </BlockContentView>
    </ul>
</template>

<style>
.bcv-wrapper {
    margin: 0;
}

.bcv-wrapper > li > span {
    width: 100%;
    display: block;
    margin-right: 0;
}
</style>
