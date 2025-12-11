// @vitest-environment happy-dom

/**
 * Component testing for components/LoginView.vue
 */
import { beforeEach, describe, expect, it, test, vi } from 'vitest'
import { nextTick } from 'vue'

import { createMountingHelper } from '../ComponentMountingUtils.js';

vi.mock('@/helpers/notifications.js', () => ({
    notificationUtils: {
        toastSuccess: vi.fn(),
        toastError: vi.fn(),
        toastWarning: vi.fn(),
        toastInfo: vi.fn(),
        startProgressToast: vi.fn(),
        tryResolveProgressToast: vi.fn(),
        tryRejectProgressToast: vi.fn(),
    }
}))

import LoginView from '@/components/Views/LoginView.vue';

const usernameSelectorCSS = '.username-field'
const passwordSelectorCSS = '.password-field'
const submitBtnSelectorCSS = '.submit-btn'

const mountLoginView = createMountingHelper(LoginView, {})

beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({
        json: () => Promise.resolve({data: '`fetch` has been overwritten in LoginView.test.js for component testing'})
    }))
})

describe('LoginView Component Tests', () => {
    describe('Client Form Validation', () => {
        test.each([
            {
                title: 'Empty username field - should error',
                selectorToBeEmpty: usernameSelectorCSS,
                selectorToBeFull: passwordSelectorCSS,
                errorMessages: 'Username or password empty',
            },
            {
                title: 'Empty password field - should error',
                selectorToBeEmpty: passwordSelectorCSS,
                selectorToBeFull: usernameSelectorCSS,
                errorMessages: 'Username or password empty',
            },
        ])('$title', async ({selectorToBeEmpty, selectorToBeFull, errorMessages}) => {
            const wrapper = mountLoginView()
            await wrapper.get(selectorToBeEmpty).setValue('')
            await wrapper.get(selectorToBeFull).setValue('full')
            await wrapper.get(submitBtnSelectorCSS).trigger('submit')
            await nextTick()
            expect(wrapper.html()).toContain(errorMessages)
        })
    })

    it('Both fields full - should submit', async () => {
        const wrapper = mountLoginView()
        await wrapper.get(usernameSelectorCSS).setValue('example@email.com')
        await wrapper.get(passwordSelectorCSS).setValue('something super secret')
        await wrapper.get(submitBtnSelectorCSS).trigger('submit')
        await nextTick()
        expect(fetch).toHaveBeenCalled()
    })
})
