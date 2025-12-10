// @vitest-environment happy-dom

/**
 * Component testing for components/RegisterNewUser.vue
 */
import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { nextTick } from 'vue'

import { createMountingHelper } from '../ComponentMountingUtils.js';
import RegisterUserView from '@/components/RegisterUserView.vue';

const usernameSelectorCSS = '.username-field'
const passwordSelectorCSS = '.password-field'
const fullNameSelectorCSS = '.full-name-field'
const submitBtnSelectorCSS = '.submit-btn'

const mountRegisterNewUser = createMountingHelper(RegisterUserView)

beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({
        json: () => Promise.resolve({data: '`fetch` has been overwritten in RegisterNewUser.test.js for component testing'})
    }))
})

describe('RegisterNewUser Component Tests', () => {
    describe('Client Form Validation', () => {
        test.each([
            {
                title: 'Empty username field - should error',
                selectorToBeEmpty: usernameSelectorCSS,
                errorMessage: 'Username is required',
            },
            {
                title: 'Empty password field - should error',
                selectorToBeEmpty: passwordSelectorCSS,
                errorMessage: 'Password is required',
            },
            {
                title: 'Empty full name field - should error',
                selectorToBeEmpty: fullNameSelectorCSS,
                errorMessage: 'Full name required',
            },
        ])('$title', async ({selectorToBeEmpty, errorMessage}) => {
            const wrapper = mountRegisterNewUser()
            await wrapper.get(selectorToBeEmpty).setValue('')
            await wrapper.get(usernameSelectorCSS).setValue((selectorToBeEmpty === usernameSelectorCSS) ? '' : 'example@email.com')
            await wrapper.get(passwordSelectorCSS).setValue((selectorToBeEmpty === passwordSelectorCSS) ? '' : 'something super secret')
            await wrapper.get(fullNameSelectorCSS).setValue((selectorToBeEmpty === fullNameSelectorCSS) ? '' : 'John Doe')
            await wrapper.get(submitBtnSelectorCSS).trigger('submit')
            await nextTick()
            expect(wrapper.html()).toContain(errorMessage)
        })
        
        it('All fields full - should submit', async () => {
            const wrapper = mountRegisterNewUser()
            await wrapper.get(usernameSelectorCSS).setValue('example@email.com')
            await wrapper.get(passwordSelectorCSS).setValue('something super secret')
            await wrapper.get(fullNameSelectorCSS).setValue('John Doe')
            await wrapper.get(submitBtnSelectorCSS).trigger('submit')
            await nextTick()
            expect(fetch).toHaveBeenCalled()
        })
    })
})
