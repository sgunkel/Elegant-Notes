// @vitest-environment happy-dom

/**
 * Component testing for components/NewPageDialog.vue
 */

import { describe, expect, it, vi } from 'vitest'


// ---- Mock circular imports BEFORE importing the component ----
// Note that we'll need to update how some things work on this
//     component later, notably with the issue of file import
//     recursion....
vi.mock('@/router/routes.js', () => ({
    router: {
        push: vi.fn(),
    }
}))

vi.mock('@/store.js', () => ({
    store: {
        setPage: vi.fn(),
    }
}))

vi.mock('@/helpers/pageFetchers.js', () => ({
    pageOperations: {
        createPage: vi.fn(),
    }
}))

import { createMountingHelper } from '../ComponentMountingUtils.js';
import NewPageDialog from '@/components/NewPageDialog.vue';

import { pageOperations } from '@/helpers/pageFetchers.js'
import { store } from '@/store.js'
import { router } from '@/router/routes.js'

const mountNewPageDialog = createMountingHelper(NewPageDialog)

describe('NewPageDialog Component Testing', () => {
    it('Empty Page name form validation', async () => {
        const wrapper = mountNewPageDialog()
        await wrapper.get('.create-page-btn').trigger('click')
        expect(wrapper.html()).toContain('Enter page name')
    })

    it('Cancel button pressed', async () => {
        const wrapper = mountNewPageDialog()
        await wrapper.get('.cancel-btn').trigger('click')
        expect(wrapper.emitted()).toHaveProperty('cancel')
    })

    it('Valid name is entered', async () => {
        const pageName = 'some page name'
        const wrapper = mountNewPageDialog()
        await wrapper.get('.page-name-text-entry').setValue(pageName)
        await wrapper.get('.create-page-btn').trigger('click')
        expect(pageOperations.createPage).toHaveBeenCalled()
        expect(store.setPage).toHaveBeenCalledWith({name: pageName, content: ''})
        expect(router.push).toHaveBeenCalledWith('/page-content')
    })
})
