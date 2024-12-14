<script>
// TODO figure out a better name for this file

import { store } from '@/store.js';
import { constants } from '@/constants.js';
import { convertPageObjToFormat } from './shared.js';
import BlockContentView from './BlockContentView.vue';

export default {
    components: {
        BlockContentView,
    },
    data() {
        return {
            loadingContent: true,
            content: [], // TODO remove all references to this
            page: store.getPage(),
            focusedBlock: undefined, // used for coping Block IDs/display its info in the header
            previousBlock: undefined,
        }
    },
    mounted() {
        const pageID = this.page['@id'].replace('Page/', '')
        const url = `${constants.URLs.PAGE_BY_ID}/${pageID}`
        store.fetchFromServer(url, {}, 'GET')
          .then(data => {
            this.content = data
            this.page.children = this.content.children
            this.checkChildren()
            this.loadingContent = false
        })
    },
    methods: {
        backBtnClicked() {
            this.$router.push(constants.PAGES.HOME)
        },
        saveChanges() {
            this.checkChildren(false)
            const obj = convertPageObjToFormat(this.page)
            store.fetchFromServer(constants.URLs.UPDATE_PAGE, obj, 'PUT')
              .then(msg => {
                console.log('Updated page:')
                console.log(msg)
              })
              .catch(error => {
                console.log('failed to update page:')
                console.log(error)
              })
        },
        checkChildren(saveNewChanges=true) {
            if (this.page.children.length !== 0) {
                return
            }

            // Object copied from BlockContentView when creating a new child
            console.log('Empty page detected - adding single child')
            const newChild = {
                // backend to take care of the id
                parent_id: '',
                text: '',
                children: [],
                parent_id: this.page['@id'],
                atRoot: true,
                startWithFocus: true,
            }
            this.page.children.push(newChild)
            if (saveNewChanges) {
                this.saveChanges()
            }
        },
        handleChildFocused(child) {
            console.log('child got focused: ' + child['@id'])
            this.focusedBlock = child
            this.previousBlock = undefined
        },
        handleChildLostFocus(child) {
            console.log('child lost focused: ' + child['@id'])
            this.focusedBlock = undefined
            this.previousBlock = child
            setTimeout(() => this.previousBlock = undefined, 500);
        },
        copyFocusedObjectIDToClipboard() {
            // TODO cleanup the ID retrieval portion
            const id = (this.previousBlock) ? this.previousBlock['@id'] :
                       (this.focusedBlock)  ? this.focusedBlock['@id']  :
                       this.page['@id']
            navigator.clipboard.writeText(id)
              .then(_ => console.log('copied text')) // TODO give some type of feedback this succeed
              .catch(error => console.log(error)) // TODO better way to show this
        },
        addChild(child, parent) {
            // TODO this needs to be cleaned up soon but school deadlines are approaching
            child.parent_id = this.page['@id']
            child.atRoot = true
            if (!parent) {
                this.page.children.push(child)
                this.saveChanges()
                return
            }

            let siblingIndex = this.page.children.indexOf(parent)
            if (siblingIndex === -1) {
                if (child.parent_id === this.page['@id']) {
                    siblingIndex = this.page.children.indexOf(child)
                    if (siblingIndex === -1) {
                        console.log('child has page id but is not in children')
                    }
                }
                else {
                    console.log('could not find sibling index via parent object')
                    return
                }
            }
            this.page.children.splice(siblingIndex + 1, 0, child)
            this.saveChanges()
        },
        removeChild(child, childIndex, addToParent=false) {
            if (addToParent) {
                console.log('de-dent caught at root level')
                return
            }
            this.page.children.splice(childIndex, 1)
            this.saveChanges()
        },
        focusNextItem(currentIndex) {
            this.keyboardNavigation(currentIndex, true)
        },
        focusPreviousItem(currentIndex) {
            this.keyboardNavigation(currentIndex, false)
        },
        keyboardNavigation(currentIndex, isGoingUp) {
            const siblings = this.page.children
            const directionValue = (isGoingUp) ? -1 : 1
            const newIndex = currentIndex + directionValue
            if (newIndex >= 0) {
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
            }
        },
    }
}
</script>

<template>
    <div class="pcp-wrapper">
        <div class="pcp-header">
            <!-- TODO add some type of separation between these two items -->
            <div class="pcp-btn" @click="backBtnClicked">
                <span>Back</span> <!-- TODO convert this to a <router-link>? -->
            </div>
            <!--
              TODO make this editable by using the component BlockContentView will use in the future
              for switching between editing text and displaying text
            -->
            <h2>{{ page.name }}</h2>
            <div class="pcp-focused-object-info">
                <h5 @click="copyFocusedObjectIDToClipboard">{{ (focusedBlock) ? focusedBlock['@id'] : page['@id'] }}</h5>
            </div>
        </div>
        <div class="pcp-loading" v-if="loadingContent">
            <h3>Loading...</h3>
        </div>
        <div class="pcp-content-scroll" v-else>
            <BlockContentView
              v-for="(child, index) in page.children || []"
              :index="index"
              :block="child"
              :parent="page"
              :at-root="true"
              @childGotFocus="handleChildFocused"
              @childLostFocus="handleChildLostFocus"
              @add-child="addChild"
              @remove-child="removeChild"
              @focus-next="focusNextItem"
              @focus-previous="focusPreviousItem">
            </BlockContentView>
        </div>
    </div>
</template>

<style>
.pcp-wrapper {
    margin: 0;
    padding: 0 0.25em;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.pcp-header {
    padding: 0.25em;
    margin-bottom: 0.25em;
    margin-top: 0.25em;
    border: 0.25em solid #000;
    border-radius: 0.15em;
    display: flex;
    flex-direction: row;
    align-items: center;
}
.pcp-header > h2 {
    margin: 0;
    padding: 0.15em;
}

.pcp-btn {
    padding: 0.5em;
    border: 0.15em solid #000;
    border-radius: 0.25em;
}

.pcp-focused-object-info {
    margin-left: auto;
}

.pcp-content-scroll {
    flex: 1;
    padding: 0 0.25em;
    overflow: auto;
}
</style>
