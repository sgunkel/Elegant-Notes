/**
 * Helper functions for component testing (see files in ./Components)
 */

import { mount } from "@vue/test-utils";

/**
 * Test helper function for component testing. Internally, this is just currying a `mount()` call with the
 *     props you'd pass to the component like normal with a way to overwrite them.
 * 
 * @example:
 * const mount<component name> = createMountingHelper(<component>, {
 *     <component props>
 * })
 * // (Inside tests)
 * const wrapper = mount<component name>({<props to override>})
 * 
 * const mountBlockEditor = createMountingHelper(BlockEditor, {
 *     blockObj: createBlockObj(),
 *     editingID: uuidv4(),
 *     indentionLevel: 0,
 *     refocusKey: 0,
 * })
 * // (Inside tests example)
 * const sharedID = uuidv4()
 * const wrapper = mountBaseEditor({editingId: sharedID, rootObjID: sharedID})
 * 
 * @param component The Vue component to mount
 * @param initialProps Initial props sent to the component
 * @param componentLevelSettings Other settings applied to the component
 * @returns Function that take props to override initial props and returns a mounted component for testing
 */
export const createMountingHelper = (component, initialProps, componentLevelSettings = {}) => {
    return (props = {}, globals = {}) => {
        return mount(component, {
            props: {
                ...initialProps,
                ...props,
            },
            global: {
                ...globals
            },
            ...componentLevelSettings,
        })
    }
}
