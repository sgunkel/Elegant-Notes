// @vitest-environment happy-dom

/**
 * Component testing for components/AuthPage.vue
 * 
 * Note that the AuthPage component uses the LoginView and RegisterNewUser
 *     components and they are tested separately. We only test the high-level
 *     functionality that AuthPage supplies.
 */
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { createMountingHelper } from '../ComponentMountingUtils.js';
import AuthPage from '@/components/AuthPage.vue';

const mountAuthPage = createMountingHelper(AuthPage)

describe('AuthPage Component Tests', () => {
    it('Mounts to Login View', () => {
        const wrapper = mountAuthPage()
        const loginViewWrapper = wrapper.get('.lv-wrapper')
        expect(loginViewWrapper.exists()).toBeTruthy()
    })

    it('Mount and click register view', async () => {
        const wrapper = mountAuthPage()

        const registrationBtn = wrapper.get('.registration-btn')
        await registrationBtn.trigger('click')
        nextTick()

        const registrationViewWrapper = wrapper.get('.ruv-wrapper')
        expect(registrationViewWrapper.exists()).toBeTruthy()
    })

    it('Toggle between views', async () => {
        const wrapper = mountAuthPage()

        const registrationBtn = wrapper.get('.registration-btn')
        await registrationBtn.trigger('click')
        nextTick()

        const registrationViewWrapper = wrapper.get('.ruv-wrapper')
        expect(registrationViewWrapper.exists()).toBeTruthy()

        const loginViewBtn = wrapper.get('.login-btn')
        expect(loginViewBtn.exists()).toBeTruthy()
        await loginViewBtn.trigger('click')
        nextTick()

        const loginView = wrapper.get('.lv-wrapper')
        expect(loginView.exists()).toBeTruthy()
    })
})
