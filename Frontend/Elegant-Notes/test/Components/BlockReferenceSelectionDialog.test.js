// @vitest-environment happy-dom

/**
 * Component testing for components/Dialogs/BlockReferenceSelectionDialog.vue
 * 
 * Some testing is concluded here that may be expected in BlockEditor.test.js since the BlockEditor component
 *     uses the BlockReferenceSelectionDialog component; since BlockReferenceSelectionDialog is teleported, it
 *     makes testing difficult in that regard, and thus we test it separately (for now).
 * Note that we query the document body for most tests here since that is where the component is teleported to.
 */

import { describe, expect, it, beforeEach } from 'vitest'
import { v4 as uuidv4 } from 'uuid'

import { createMountingHelper } from '../ComponentMountingUtils'

import BlockReferenceSelectionDialog from "@/components/Dialogs/BlockReferenceSelectionDialog.vue"

const mockResults = [
    { id: uuidv4(), text: 'Block One' },
    { id: uuidv4(), text: 'Block Two' },
]

const mockRect = {
    top: 100,
    bottom: 120,
    left: 50,
}

const wrapperSelectorCSS = '.brsd-wrapper'
const sizeUnit = 'px'

const mountBlockReferenceSelectionDialog = createMountingHelper(BlockReferenceSelectionDialog, {
    componentRect: mockRect,
    hasFocus: true,
    searchResults: mockResults,
}, {
    attachTo: document.body,
})

describe('BlockReferenceSelectionDialog Component Tests', () => {
    beforeEach(() => {
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 1000,
        })
        document.body.innerHTML = ''
    })

    it('Renders mock search results when focused', () => {
        mountBlockReferenceSelectionDialog()

        const popup = document.body.querySelector(wrapperSelectorCSS)
        expect(popup).not.toBeNull()

        const items = document.body.querySelectorAll('.brsd-result-item')
        expect(items.length).toBe(2)

        expect(items[0].textContent).toContain('Block One')
        expect(items[1].textContent).toContain('Block Two')
    })

    it('Set hasFocus to false - should hide dialog', () => {
        mountBlockReferenceSelectionDialog({hasFocus: false})

        const popup = document.body.querySelector(wrapperSelectorCSS)
        expect(getComputedStyle(popup).display).toBe('none')
    })

    it('Default positioning - should be above the editor is space allows', () => {
        mountBlockReferenceSelectionDialog()

        const popup = document.body.querySelector(wrapperSelectorCSS)
        expect(popup.style.top).toBe(`${mockRect.bottom + 8}${sizeUnit}`)
        expect(popup.style.left).toBe(`${mockRect.left}${sizeUnit}`)
    })

    it('Reference selected - should emit reference-selected', () => {
        const wrapper = mountBlockReferenceSelectionDialog()

        // Headless UI emits update:modelValue internally
        wrapper.findComponent({ name: 'Combobox' })
            .vm
            .$emit('update:modelValue', mockResults[1])

        expect(wrapper.emitted('reference-selected')).toBeTruthy()
        expect(wrapper.emitted('reference-selected')[0][0]).toEqual(mockResults[1])
    })

    it('Component receives null editor rectangle - should not apply styles', () => {
        mountBlockReferenceSelectionDialog({ componentRect: null })

        const popup = document.body.querySelector(wrapperSelectorCSS)
        expect(popup).not.toBeNull()

        // No positioning applied
        expect(popup.hasAttribute('style')).not.toBeTruthy()
    })
})
