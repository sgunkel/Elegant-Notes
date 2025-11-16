// @vitest-environment happy-dom

/**
 * Component testing for BaseEditor
 */
import { describe, expect, it, test } from 'vitest'
import { nextTick } from 'vue'

import { v4 as uuidv4 } from 'uuid'

import { createMountingHelper } from '../ComponentMountingUtils.js';
import BaseEditor from '@/components/Editors/BaseEditor.vue';

const editModeClassSelectorCSS = '.base-editor-text-edit'
const presentationModeClassSelectorCSS = '.base-editor-converted-text'
const mountBaseEditor = createMountingHelper(BaseEditor, {
    editingId: uuidv4(),
    rootObjID: uuidv4(),
    readonlyText: 'Hello World',
    textToHTMLFunction: (x) => `<p>${x}</p>`
})

describe('BaseEditor Component Tests', () => {
    describe('Mounting', () => {
        it('Mounts to Presentation Mode', () => {
            const wrapper = mountBaseEditor()
            expect(wrapper.exists()).toBeTruthy()

            // Check that readonly text renders correctly in presentation mode
            const div = wrapper.get(presentationModeClassSelectorCSS)
            expect(div.exists()).toBeTruthy()
            expect(div.html()).toContain('<p>Hello World</p>')
        })

        it('Mounts to Edit Mode', () => {
            const sharedID = uuidv4()
            const wrapper = mountBaseEditor({editingId: sharedID, rootObjID: sharedID})
            expect(wrapper.exists()).toBeTruthy()

            // Check that readonly text renders correctly in edit mode
            const input = wrapper.get(editModeClassSelectorCSS)
            expect(input.exists()).toBeTruthy()
            expect(input.element.value).toContain('Hello World')
        })
    })

    describe('Simulated Events', () => {
        test.each([
            [true,  'keyup',    {}, 'update-text', {}],
            [true,  'blur',     {}, 'update-text', {}],
            [true,  'blur',     {}, 'blur-requested', {}],
            [true,  'keydown',  {key: 'tab'}, 'indent-requested', {}],
            [true,  'keydown',  {key: 'tab', shiftKey: true}, 'outdent-requested', {}],
            [true,  'keydown',  {key: 'ArrowUp'}, 'navigate-up-requested', {}],
            [true,  'keydown',  {key: 'ArrowDown'}, 'navigate-down-requested', {}],
            [false, 'click',    {}, 'focus-for-edit-request', {}],
            [true,  'keydown',  {key: 'Backspace'}, 'delete-object-requested', {readonlyText: ''}],
            [true,  'keydown',  {key: 'Enter'}, 'create-new-object-requested', {}]
        ])('(Edit mode: %s) Triggers event `%s` (with args %j) and expects signal `%s` (Component props: %j)', async (inEditMode, eventTrigger, eventTriggerArgs, signalEmitted, componentProps) => {
            let wrapper
            let cssSelector
            if (inEditMode) {
                const sharedID = uuidv4()
                wrapper = mountBaseEditor({editingId: sharedID, rootObjID: sharedID, ...componentProps})
                cssSelector = editModeClassSelectorCSS
            }
            else {
                wrapper = mountBaseEditor(componentProps)
                cssSelector = presentationModeClassSelectorCSS
            }
            expect(wrapper.exists()).toBeTruthy()
            await wrapper.get(cssSelector).trigger(eventTrigger, eventTriggerArgs)
            expect(wrapper.emitted()).toHaveProperty(signalEmitted)
        })
    })

    describe('Behavior', () => {
        it('Toggle Presentation->Edit->Presentation Modes', async () => {
            const sharedID = uuidv4()
            const wrapper = mountBaseEditor({editingId: sharedID, rootObjID: sharedID})
            expect(wrapper.exists()).toBeTruthy()

            // Should be in Edit mode
            const renderedInEditMode = wrapper.get(editModeClassSelectorCSS)
            expect(renderedInEditMode.exists()).toBeTruthy()

            // Switch back to Presentation mode
            await wrapper.setProps({editingId: uuidv4()})
            await nextTick()

            // Should be in Presentation mode
            const revertedToPresentationMode = wrapper.get(presentationModeClassSelectorCSS)
            expect(revertedToPresentationMode.exists()).toBeTruthy()

            // Switch to Edit mode
            await wrapper.setProps({ editingId: sharedID })
            await nextTick()

            // Should be in Edit mode again
            const revertedBackToEditMode = wrapper.get(editModeClassSelectorCSS)
            expect(revertedBackToEditMode.exists()).toBeTruthy()
        })

        it('Toggle Edit->Presentation->Edit Modes', async () => {
            const rootObjID = uuidv4()
            const wrapper = mountBaseEditor({rootObjID})
            expect(wrapper.exists()).toBeTruthy()

            // Should begin in Presentation mode
            const mountedPresentationMode = wrapper.get(presentationModeClassSelectorCSS)
            expect(mountedPresentationMode.exists()).toBeTruthy()

            // Switch to Edit mode
            await wrapper.setProps({ editingId: rootObjID })
            await nextTick()

            // Should be in Edit mode
            const renderedInEditMode = wrapper.get(editModeClassSelectorCSS)
            expect(renderedInEditMode.exists()).toBeTruthy()

            // Switch back to Presentation mode
            await wrapper.setProps({editingId: uuidv4()})
            await nextTick()

            // Should be in Presentation mode again
            const revertedToPresentationMode = wrapper.get(presentationModeClassSelectorCSS)
            expect(revertedToPresentationMode.exists()).toBeTruthy()
        })

        it('Does *not* emit `delete-object-requested` with text content', async () => {
            const sharedID = uuidv4()
            const wrapper = mountBaseEditor({editingId: sharedID, rootObjID: sharedID})
            expect(wrapper.exists()).toBeTruthy()
            await wrapper.get(editModeClassSelectorCSS).trigger('click', 'Backspace')
            expect(wrapper.emitted()).not.toHaveProperty('delete-object-requested')
        })
    })
})
