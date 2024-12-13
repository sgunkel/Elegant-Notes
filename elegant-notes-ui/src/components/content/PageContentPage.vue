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
            content: [], // TODO remove all references to this
            page: store.getPage(),
        }
    },
    mounted() {
        const pageID = this.page['@id'].replace('Page/', '')
        const url = `${constants.URLs.PAGE_BY_ID}/${pageID}`
        store.fetchFromServer(url, {}, 'GET')
          .then(data => {
            this.content = data
            this.page.children = this.content.children
        })
    },
    methods: {
        saveChanges() {
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
        addChild(child, parent) {
            // TODO this needs to be cleaned up soon but deadlines are approaching
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
    <h1>page content</h1>
    <h3>{{ page.name }}</h3>
    <BlockContentView
      v-for="(child, index) in page.children || []"
      :index="index"
      :block="child"
      :parent="page"
      :at-root="true"
      @add-child="addChild"
      @remove-child="removeChild"
      @focus-next="focusNextItem"
      @focus-previous="focusPreviousItem">
    </BlockContentView>
</template>

<style>
</style>
