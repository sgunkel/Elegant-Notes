// @vitest-environment happy-dom

/**
 * Component testing for components/PageEntry.vue
 */
import { describe, expect, it, vi } from 'vitest'
import { createMountingHelper } from '../ComponentMountingUtils'

import PageEntry from '@/components/PageEntry.vue'

const createPageObj = (args = {}) => {
    return {
        name: 'some page name',
        creation: '1/1/1 12:34PM',
        last_modified: '1/1/1 3:21AM',
        ...args
    }
}

const mountPageEntry = createMountingHelper(PageEntry, {
    page: createPageObj(),
})

const divCSS = '.pe-background'

describe('PageEntry Component Tests', () => {
    it('Object and properties renders', () => {
        const pageObj = createPageObj()
        const wrapper = mountPageEntry()
        expect(wrapper.exists()).toBeTruthy()

        const div = wrapper.get(divCSS)
        expect(div.exists()).toBeTruthy()

        const html = div.html()
        expect(html).toContain(`<span>${pageObj.name}</span>`)
        expect(html).toContain(`<span>${pageObj.creation}</span>`)
        expect(html).toContain(`<span>${pageObj.last_modified}</span>`)
    })

    it('Clicked event triggers $router.push', async () => {
        const mockPush = vi.fn()
        const mockRouter = {
            push: mockPush,
        }

        const wrapper = mountPageEntry({}, {
            mocks: {
                $router: mockRouter,
            }
        })
        const div = wrapper.get(divCSS)
        await div.trigger('click')

        expect(mockPush).toHaveBeenCalledWith('/page-content')
    })
})
