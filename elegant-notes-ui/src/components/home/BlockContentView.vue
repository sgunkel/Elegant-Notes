<script>
import { nextTick, ref } from 'vue';


export default {
    props: {
        block: Object,
    },
    data() {
        return {
            // state is created and given to us from setup()
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
    methods: {
        enterEditMode() {
            this.focused = true
            this.setFocus()
        },
        EnterPresentationMode() {
            this.focused = false
            // TODO: save changes!
        }
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
              @blur="EnterPresentationMode">
            <span
              v-else
              @click="enterEditMode">
                {{ block.text }}
            </span>
        </li>
        <BlockContentView
          v-for="child in block.children"
          :block="child">
        </BlockContentView>
    </ul>
</template>

<style>
.bcv-wrapper {
    margin: 0;
}
</style>
