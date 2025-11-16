/**
 * Helper functions for component testing (see files in ./Components)
 */

import { mount } from "@vue/test-utils";

/**
 * Test helper function for component testing. Internally, this is just currying a `mount()` call with the
 *     props you'd pass to the component like normal with a way to overwrite them.
 * 
 * @param component The Vue component to mount
 * @param initialProps Initial props sent to the component
 * @returns Function that take props to override initial props and returns a mounted component for testing
 */
export const createMountingHelper = (component, initialProps) => {
    return (props = {}) => {
        return mount(component, {
            props: {
                ...initialProps,
                ...props,
            },
        })
    }
}
