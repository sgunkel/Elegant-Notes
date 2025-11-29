// @vitest-environment happy-dom

/**
 * Component testing for components/Editors/PageNameEditor.vue
 */
import { describe, expect, it, test } from 'vitest'
import { v4 as uuidv4 } from 'uuid'

import { createMountingHelper } from '../ComponentMountingUtils.js'
import PageNameEditor from '@/components/Editors/PageNameEditor.vue'

const editModeClassSelectorCSS = '.base-editor-text-edit'
const presentationModeClassSelectorCSS = '.base-editor-converted-text'

const createPageObj = (args = {}) => {
    return {
        id: uuidv4(),
        name: 'some page name',
        ...args
    }
}
const mountPageNameEditor = createMountingHelper(PageNameEditor, {
    pageObj: createPageObj(),
    editingId: uuidv4(),
})

const blurEvent = 'request-blur'
const focusEvent = 'request-focus'
const textUpdateEvent = 'request-text-update'

describe('PageNameEditor Component Tests', () => {
    describe('Mounting', () => {
        it('Mount to Presentation Mode', () => {
            const pageName = 'Should be in Presentation Mode'
            const wrapper = mountPageNameEditor({pageObj: createPageObj({name: pageName})})
            expect(wrapper.exists()).toBeTruthy()
            
            // Check that readonly text renders correctly in presentation mode
            const div = wrapper.get(presentationModeClassSelectorCSS)
            expect(div.exists()).toBeTruthy()
            expect(div.html()).toContain(`<h2>${pageName}</h2>`)
        })

        it('Mount to Edit Mode', () => {
            const sharedID = uuidv4()
            const pageName = 'Should be in Edit Mode'
            const wrapper = mountPageNameEditor({editingId: sharedID, pageObj: createPageObj({id: sharedID, name: pageName})})
            expect(wrapper.exists()).toBeTruthy()

            // Check that readonly text renders correctly in edit mode
            const input = wrapper.get(editModeClassSelectorCSS)
            expect(input.exists()).toBeTruthy()
            expect(input.element.value).toContain(pageName)
        })
    })

    describe('Simulated Events', () => {
        test.each([
            [true,  'keyup',    {},                           '',         {}],
            [true,  'blur',     {},                           blurEvent,  {}],
            [true,  'keydown',  {key: 'tab'},                 blurEvent,  {}],
            [true,  'keydown',  {key: 'tab', shiftKey: true}, blurEvent,  {}],
            [true,  'keydown',  {key: 'ArrowUp'},             blurEvent,  {}],
            [true,  'keydown',  {key: 'ArrowDown'},           blurEvent,  {}],
            [false, 'click',    {},                           focusEvent, {}],
            [true,  'keydown',  {key: 'Backspace'},           '',         {name: ''}],
            [true,  'keydown',  {key: 'Backspace'},           '',         {}],
            [true,  'keydown',  {key: 'Enter'},               blurEvent,  {}]
        ])('(Edit mode: %s) Triggers event `%s` (with args %j) and expects signal `%s` (Component props: %j)', async (inEditMode, eventTrigger, eventTriggerArgs, signalEmitted, pageProps) => {
            let wrapper
            let cssSelector
            if (inEditMode) {
                const sharedID = uuidv4()
                wrapper = mountPageNameEditor({editingId: sharedID, pageObj: createPageObj({id: sharedID, ...pageProps})})
                cssSelector = editModeClassSelectorCSS
            }
            else {
                wrapper = mountPageNameEditor(createPageObj(pageProps))
                cssSelector = presentationModeClassSelectorCSS
            }
            expect(wrapper.exists()).toBeTruthy()
            await wrapper.get(cssSelector).trigger(eventTrigger, eventTriggerArgs)
            if (signalEmitted){
                expect(wrapper.emitted()).toHaveProperty(signalEmitted)
            } 
            else {
                expect(wrapper.emitted()).not.toHaveProperty([blurEvent, focusEvent, textUpdateEvent])
            }
        })
    })
})
