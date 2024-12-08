<script>
import { store } from '@/store.js';
import { constants } from '@/constants.js';
import BlockContentView from './BlockContentView.vue';

export default {
    props: {
        page: Object
    },
    components: {
        BlockContentView,
    },
    data() {
        return {
            content: []
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
        addChild(child, parent) {
            // TODO this needs to be cleaned up soon but deadlines are approaching
            child.parent_id = this.page['@id']
            child.atRoot = true
            if (!parent) {
                this.page.children.push(child)
                return
            }

            let siblingIndex = this.page.children.indexOf(parent)
            if (siblingIndex === -1) {
                if (child.parent_id === this.page['@id']) {
                    console.log('trying to add item already at root')
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
            console.log('adding child at root')
            this.page.children.splice(siblingIndex + 1, 0, child)
        },
        removeChild(child, childIndex, addToParent=false) {
            if (addToParent) {
                console.log('de-dent caught at root level')
                return
            }
            this.page.children.splice(childIndex, 1)
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
      :parent="content"
      :at-root="true"
      @add-child="addChild"
      @remove-child="removeChild">
    </BlockContentView>
</template>

<style>
</style>
