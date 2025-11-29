// @vitest-environment happy-dom

/**
 * Component testing for components/Editors/BlockEditor.vue
 * 
 * Note that a lot of the event testing is done in ./BaseEditor.test.js as the
 *     BlockEditor component uses it and relays its events upstream. The tests in
 *     this file are mainly checking for how Blocks are rendered with children
 *     before and after an event happens.
 */
import { describe, expect, it, test, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

import { v4 as uuidv4 } from 'uuid'

import { createMountingHelper } from '../ComponentMountingUtils.js';
import { createBlockObj, flattenBlockChildren } from '../blockObjUtils.js';
import BlockEditor from '@/components/Editors/BlockEditor.vue';
import { flushPromises } from '@vue/test-utils';

const indentionUnitCSS = 'px'
const blockEditorWrapperSelectorCSS = '.be-wrapper'
const editModeClassSelectorCSS = '.base-editor-text-edit'
const presentationModeClassSelectorCSS = '.base-editor-converted-text'

const mountBlockEditor = createMountingHelper(BlockEditor, {
    blockObj: createBlockObj(),
    editingID: uuidv4(),
    indentionLevel: 0,
    refocusKey: 0,
})

const getRenderedChildren = (wrapper) => {
    return wrapper
        .findAllComponents(BlockEditor)
        .filter(c => c.vm !== wrapper.vm)
}

const getComponentComparisonMetadata = (components) => {
    return components.map(x => {
        return {
            indentionLevel: x.props('indentionLevel'),
            id: x.props('blockObj').id,
            marginLeft: x.get(blockEditorWrapperSelectorCSS).element.style.marginLeft,
        }
    })
}

const getBlockComparisonMetadata =(blockFlatList) => {
    return blockFlatList.map(x => {
        return {
            indentionLevel: x.indentionLevel,
            id: x.id,
            marginLeft: `${x.indentionLevel * 20}${indentionUnitCSS}`,
        }
    })
}

const getTextFromID = (id, block) => {
    if (block.id === id) {
        return block.content
    }
    for (const child of block.children) {
        const content = getTextFromID(id, child)
        if (content !== null) {
            return content
        }
    }
    return null
}

beforeEach(() => {
    const raf = fn => setTimeout(() => fn(new Date()), 16)
    vi.stubGlobal('requestAnimationFrame', raf)
})

describe('BaseEditor Component Tests', () => {
    describe('Mounting', () => {
        /**
         * Most of this has already been tested thoroughly in ./BaseEditor.test.js,
         *     so we only make sure that it mounts correctly
         */
        it('Mounts to Presentation Mode', () => {
            const wrapper = mountBlockEditor()
            expect(wrapper.exists()).toBeTruthy()

            // Check that readonly text renders correctly in presentation mode
            const div = wrapper.get(presentationModeClassSelectorCSS)
            expect(div.exists()).toBeTruthy()
            expect(div.html()).toContain('<p>Hello World')
        })

        it('Mounts with children to Presentation Mode', () => {
            const children = [
                createBlockObj(),
                createBlockObj(),
                createBlockObj(),
            ]
            const blockObj = createBlockObj({children})
            const wrapper = mountBlockEditor({blockObj})
            expect(wrapper.exists()).toBeTruthy()

            // Check that the correct number of Blocks are in Presentation mode
            expect(wrapper.findAll(presentationModeClassSelectorCSS)).toHaveLength(children.length + 1) // +1 for the root Block

            // Check that nothing is in Edit Mode
            expect(wrapper.findAll(editModeClassSelectorCSS)).toHaveLength(0)
        })
        
        it('Mounts to Edit Mode', () => {
            const sharedID = uuidv4()
            const blockObj = createBlockObj({id: sharedID})
            const wrapper = mountBlockEditor({blockObj, editingID: sharedID})
            expect(wrapper.exists()).toBeTruthy()

            // Check that readonly text renders correctly in edit mode
            const input = wrapper.get(editModeClassSelectorCSS)
            expect(input.exists()).toBeTruthy()
            expect(input.element.value).toContain('Hello World')
        })

        it('Mounts with children to Edit Mode', () => {
            const sharedID = uuidv4()
            const children = [
                createBlockObj(),
                createBlockObj(),
                createBlockObj(),
            ]
            const blockObj = createBlockObj({id: sharedID, content: 'root Block object', children})
            const wrapper = mountBlockEditor({editingID: sharedID, blockObj})
            expect(wrapper.exists()).toBeTruthy()

            // Check that only the children are in Presentation mode
            expect(wrapper.findAll(presentationModeClassSelectorCSS)).toHaveLength(children.length)

            // Check that only the root Block is in Edit mode
            expect(wrapper.findAll(editModeClassSelectorCSS)).toHaveLength(1)
            const input = wrapper.get(editModeClassSelectorCSS)
            expect(input.element.value).toContain('root Block object')
        })
    })

    describe('Block Children Rendering', () => {
        test.each([
            {
                title: 'Basic list',
                block: createBlockObj({children: [
                    createBlockObj(),
                    createBlockObj(),
                    createBlockObj(),
                ]})
            },
            {
                title: 'Single nested list',
                block: createBlockObj({children: [
                    createBlockObj({children: [
                        createBlockObj(),
                    ]}),
                ]})
            },
            {
                title: 'Double nested list',
                block: createBlockObj({children: [
                    createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj(),
                        ]}),
                    ]}),
                ]})
            },
            {
                title: 'Triple nested list',
                block: createBlockObj({children: [
                    createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                            ]}),
                        ]}),
                    ]}),
                ]})
            },
            {
                title: 'Multi nested list',
                block: createBlockObj({children: [
                    createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                                createBlockObj({children: [
                                    createBlockObj(),
                                ]}),
                                createBlockObj(),
                                createBlockObj({children: [
                                    createBlockObj()
                                ]}),
                            ]}),
                        ]}),
                        createBlockObj(),
                    ]}),
                    createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                            ]}),
                        ]}),
                        createBlockObj(),
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                            ]}),
                        ]}),
                    ]}),
                ]}),
            },
        ])('$title', ({block}) => {
            const wrapper = mountBlockEditor({blockObj: block})
            expect(wrapper.exists()).toBeTruthy()
            
            const flattenBlocks = flattenBlockChildren(block).filter(x => x.id !== block.id)
            const children = wrapper.findAllComponents(BlockEditor).filter(c => c !== wrapper)
            expect(children).toHaveLength(flattenBlocks.length)

            // Verify indention levels
            const renderedIndentionLevels = children.map(x => x.props('indentionLevel'))
            const expectedIndentionLevels = flattenBlocks.map(x => x.indentionLevel)
            expect(renderedIndentionLevels).toStrictEqual(expectedIndentionLevels)

            // Verify Block order
            const renderedBlockIDsOrder = children.map(x => x.props('blockObj').id)
            const expectedBlockIDsOrder = flattenBlocks.map(x => x.id)
            expect(renderedBlockIDsOrder).toStrictEqual(expectedBlockIDsOrder)

            // Verify generated CSS for rendered indention
            const renderedIndentionsCSS = children.map(x => x.get(blockEditorWrapperSelectorCSS).element.style.marginLeft)
            const expectedIndentionsCSS = flattenBlocks.map(x => `${x.indentionLevel * 20}${indentionUnitCSS}`)
            expect(renderedIndentionsCSS).toStrictEqual(expectedIndentionsCSS)
        })
    })

    // might be able to remove below since we do the same thing below it...
    describe('BaseEditor Events Relay', () => {
        /** Copy/pasted from BaseEditor.test.js because it's supposed to just relay the signals up */
        test.each([
            [true,  'keyup',    {}, 'request-block-update', {}],
            [true,  'blur',     {}, 'request-block-update', {}],
            [true,  'blur',     {}, 'request-blur', {}],
            [true,  'keydown',  {key: 'tab'}, 'request-indent', {}],
            [true,  'keydown',  {key: 'tab', shiftKey: true}, 'request-outdent', {}],
            [true,  'keydown',  {key: 'ArrowUp'}, 'request-navigate-up', {}],
            [true,  'keydown',  {key: 'ArrowDown'}, 'request-navigate-down', {}],
            [false, 'click',    {}, 'request-focus', {}],
            [true,  'keydown',  {key: 'Backspace'}, 'request-delete-block', {content: ''}],
            [true,  'keydown',  {key: 'Enter'}, 'request-create-block', {}]
        ])('(Edit mode: %s) Triggers event `%s` (with args %j) and expects signal `%s` (Component props: %j)', async (inEditMode, eventTrigger, eventTriggerArgs, signalEmitted, blockProps) => {
            let wrapper
            let cssSelector
            if (inEditMode) {
                const sharedID = uuidv4()
                wrapper = mountBlockEditor({editingID: sharedID, blockObj: createBlockObj({id: sharedID, ...blockProps})})
                cssSelector = editModeClassSelectorCSS
            }
            else {
                wrapper = mountBlockEditor(createBlockObj(blockProps))
                cssSelector = presentationModeClassSelectorCSS
            }
            expect(wrapper.exists()).toBeTruthy()
            await wrapper.get(cssSelector).trigger(eventTrigger, eventTriggerArgs)
            expect(wrapper.emitted()).toHaveProperty(signalEmitted)
        })

        it('Does *not* emit `request-delete-block` with text content', async () => {
            const sharedID = uuidv4()
            const wrapper = mountBlockEditor({editingID: sharedID, blockObj: createBlockObj({id: sharedID})})
            expect(wrapper.exists()).toBeTruthy()
            await wrapper.get(editModeClassSelectorCSS).trigger('click', 'Backspace')
            expect(wrapper.emitted()).not.toHaveProperty('delete-object-requested')
        })
    })

    describe('Rerender Post Event Handler', () => {
        const editingID = uuidv4()
        const newEditID = uuidv4()
        // Note that on the event handler below, Vue Test Util does not
        //     simulate the `keyup` event automatically, so we manually
        //     do that after each `keydown` event.
        const userPressesTabKeyOnInput = async (wrapper) => {
            const input = wrapper.get(editModeClassSelectorCSS)
            await input.trigger('keydown', {key: 'Tab'})
            await input.trigger('keyup')
        }
        const userPressesShiftTabKeyOnInput = async (wrapper) => {
            const input = wrapper.get(editModeClassSelectorCSS)
            await input.trigger('keydown', {key: 'Tab', shiftKey: true})
            await input.trigger('keyup')
        }
        const userPressesUpArrowOnInput = async (wrapper) => {
            const input = wrapper.get(editModeClassSelectorCSS)
            await input.trigger('keydown',  {key: 'ArrowUp'})
            await input.trigger('keyup')
        }
        const userPressesDownArrowOnInput = async (wrapper) => {
            const input = wrapper.get(editModeClassSelectorCSS)
            await input.trigger('keydown',  {key: 'ArrowDown'})
            await input.trigger('keyup')
        }
        const userPressesBackspaceOnInput = async (wrapper) => {
            const input = wrapper.get(editModeClassSelectorCSS)
            await input.trigger('keydown',  {key: 'Backspace'})
            await input.trigger('keyup')
        }
        const userPressesEnterOnInput = async (wrapper) => {
            const input = wrapper.get(editModeClassSelectorCSS)
            await input.trigger('keydown',  {key: 'Enter'})
            await input.trigger('keyup')
        }

        const expectedBlockUpdateSignals = ['request-block-update']
        const expectedIndentionSignals = ['request-indent']
        const expectedOutdentionSignals = ['request-outdent']
        const expectedNavigateUpSignals = ['request-navigate-up']
        const expectedNavigateDownSignals = ['request-navigate-down']
        const expectedDeleteBlockSignals = ['request-delete-block']
        const expectedNewBlockSignals = ['request-create-block']
        test.each([
            ///
            /// Indent Blocks without children
            ///
            {
                title: 'User indents last child on root level Block without grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj({id: editingID})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id})
                        ]})
                    ]})
                },
            },
            {
                title: 'User indents last child on second level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj(),
                            createBlockObj({id: editingID}),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id})
                            ]})
                        ]})
                    ]})
                },
            },
            {
                title: 'User indents last child on third level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                                createBlockObj({id: editingID}),
                            ]})
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id, children: [
                                    createBlockObj({id: flattenBlocks[4].id})
                                ]})
                            ]})
                        ]})
                    ]})
                },
            },

            ///
            /// Indent nested Blocks without children
            ///
            {
                title: 'User indents middle child on root level Block without grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj({id: editingID}),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id})
                        ]}),
                        createBlockObj(flattenBlocks[3].id),
                    ]})
                },
            },
            {
                title: 'User indents middle child on second level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj(),
                            createBlockObj({id: editingID}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id})
                            ]}),
                            createBlockObj({id: flattenBlocks[4].id}),
                        ]})
                    ]})
                },
            },
            {
                title: 'User indents middle child on third level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                                createBlockObj({id: editingID}),
                                createBlockObj(),
                            ]})
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id, children: [
                                    createBlockObj({id: flattenBlocks[4].id})
                                ]}),
                                createBlockObj({id: flattenBlocks[5].id}),
                            ]})
                        ]})
                    ]})
                },
            },

            ///
            /// Indent Blocks with children
            ///
            {
                title: 'User indents last child on root level Block with grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj({id: editingID, children: [
                            createBlockObj(),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                                createBlockObj({id: flattenBlocks[4].id})
                            ]})
                        ]})
                    ]})
                },
            },
            {
                title: 'User indents last child on second level Block with grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj({id: editingID, children: [
                            createBlockObj({children: [
                                createBlockObj(),
                                createBlockObj(),
                            ]}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id, children: [
                                    createBlockObj({id: flattenBlocks[4].id}),
                                    createBlockObj({id: flattenBlocks[5].id}),
                                ]}),
                                createBlockObj({id: flattenBlocks[6].id}),
                            ]})
                        ]})
                    ]})
                },
            },
            {
                title: 'User indents last child on third level Block with grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj({children: [
                            createBlockObj(),
                            createBlockObj({id: editingID, children: [
                                createBlockObj(),
                                createBlockObj(),
                            ]}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedIndentionSignals,
                simulateEventFn: userPressesTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id, children: [
                                    createBlockObj({id: flattenBlocks[4].id, children: [
                                        createBlockObj({id: flattenBlocks[5].id}),
                                        createBlockObj({id: flattenBlocks[6].id}),
                                    ]}),
                                ]}),
                                createBlockObj({id: flattenBlocks[7].id}),
                            ]})
                        ]})
                    ]})
                },
            },

            ///
            /// Outdent Blocks without children - all outdent tests are the inverse of the indent tests
            ///
            {
                title: 'User outdents last child on root level Block without grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID}),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                    ]})
                },
            },
            {
                title: 'User outdents last child on second level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj({id: editingID}),
                            ]}),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                        ]})
                    ]})
                },
            },
            {
                title: 'User outdents last child on third level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj({children: [
                                    createBlockObj({id: editingID}),
                                ]}),
                            ]})
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                                createBlockObj({id: flattenBlocks[4].id}),
                            ]})
                        ]})
                    ]})
                },
            },

            ///
            /// Outdent nested Blocks without children
            ///
            {
                title: 'User outdents middle child on root level Block without grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID}),
                        ]}),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                        createBlockObj({id: flattenBlocks[3].id}),
                    ]})
                },
            },
            {
                title: 'User outdents middle child on second level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj({id: editingID}),
                            ]}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                            createBlockObj({id: flattenBlocks[4].id}),
                        ]})
                    ]})
                },
            },
            {
                title: 'User indents middle child on third level Block',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj({children: [
                                    createBlockObj({id: editingID}),
                                ]}),
                                createBlockObj(),
                            ]})
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                                createBlockObj({id: flattenBlocks[4].id}),
                                createBlockObj({id: flattenBlocks[5].id}),
                            ]})
                        ]})
                    ]})
                },
            },

            ///
            /// Outdent Blocks with children
            ///
            {
                title: 'User Outdents last child on root level Block with grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children:[
                            createBlockObj({id: editingID, children: [
                                createBlockObj(),
                                createBlockObj(),
                            ]})
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id, children: [
                            createBlockObj({id: flattenBlocks[3].id}),
                            createBlockObj({id: flattenBlocks[4].id})
                        ]})
                    ]})
                },
            },
            {
                title: 'User outdents last child on second level Block with grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID, children: [
                                createBlockObj({children: [
                                    createBlockObj(),
                                    createBlockObj(),
                                ]}),
                                createBlockObj(),
                            ]}),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id, children: [
                            createBlockObj({id: flattenBlocks[3].id, children: [
                                createBlockObj({id: flattenBlocks[4].id}),
                                createBlockObj({id: flattenBlocks[5].id}),
                            ]}),
                            createBlockObj({id: flattenBlocks[6].id}),
                        ]})
                    ]})
                },
            },
            {
                title: 'User outdents last child on third level Block with grandchildren',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj({id: editingID, children: [
                                    createBlockObj(),
                                    createBlockObj(),
                                ]}),
                            ]}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedOutdentionSignals,
                simulateEventFn: userPressesShiftTabKeyOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                                createBlockObj({id: flattenBlocks[4].id, children: [
                                    createBlockObj({id: flattenBlocks[5].id}),
                                    createBlockObj({id: flattenBlocks[6].id}),
                                ]}),
                                createBlockObj({id: flattenBlocks[7].id}),
                            ]})
                        ]})
                    ]})
                },
            },

            ///
            /// Navigate up a Block
            ///
            {
                title: 'User navigates up at the top of the root level',
                block: (() => {
                    return createBlockObj({id: editingID, children: [
                        createBlockObj(),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateUpSignals,
                simulateEventFn: userPressesUpArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    // structure does not change
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                    ]})
                },
            },
            {
                title: 'User navigates up at the second level to parent',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({id: newEditID, children: [
                        createBlockObj({id: editingID}),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateUpSignals,
                simulateEventFn: userPressesUpArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                    ]})
                },
            },
            {
                title: 'User navigates up at the second level to sibling',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: newEditID}),
                        createBlockObj({id: editingID}),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateUpSignals,
                simulateEventFn: userPressesUpArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                        createBlockObj({id: flattenBlocks[3].id}),
                    ]})
                },
            },
            {
                title: 'User navigates up at the third level to parent',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: newEditID, children: [
                            createBlockObj({id: editingID}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateUpSignals,
                simulateEventFn: userPressesUpArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                        ]}),
                    ]})
                },
            },
            {
                title: 'User navigates up at the third level to sibling',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: newEditID}),
                            createBlockObj({id: editingID}),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateUpSignals,
                simulateEventFn: userPressesUpArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                        ]}),
                    ]})
                },
            },

            ///
            /// Navigate down a Block
            /// (The inverse of navigating up tests)
            ///
            {
                title: 'User navigates down at the root level with no children',
                block: (() => {
                    return createBlockObj({id: editingID})
                })(),
                signalsToBeEmitted: expectedNavigateDownSignals,
                simulateEventFn: userPressesDownArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    // structure does not change
                    return createBlockObj({id: flattenBlocks[0].id})
                },
            },
            {
                title: 'User navigates down at the second level from parent',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({id: editingID, children: [
                        createBlockObj({id: newEditID}),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateDownSignals,
                simulateEventFn: userPressesDownArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                    ]})
                },
            },
            {
                title: 'User navigates down at the second level to sibling',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: editingID}),
                        createBlockObj({id: newEditID}),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateDownSignals,
                simulateEventFn: userPressesDownArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                        createBlockObj({id: flattenBlocks[3].id}),
                    ]})
                },
            },
            {
                title: 'User navigates down at the third level from parent',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: editingID, children: [
                            createBlockObj({id: newEditID}),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateDownSignals,
                simulateEventFn: userPressesDownArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                        ]}),
                    ]})
                },
            },
            {
                title: 'User navigates down at the third level to sibling',
                useNewEditID: true,
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID}),
                            createBlockObj({id: newEditID}),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedNavigateDownSignals,
                simulateEventFn: userPressesDownArrowOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                        ]}),
                    ]})
                },
            },

            ///
            /// Delete a Block
            ///
            {
                title: 'User presses backspace at root level with text with children',
                block: (() => {
                    return createBlockObj({id: editingID, content: 'delete this letter: a', children: [
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, content: 'delete this letter: ', children: [
                        createBlockObj({id: flattenBlocks[1].id})
                    ]})
                },
            },
            {
                title: 'User presses backspace at root level without text without children',
                block: (() => {
                    return createBlockObj({id: editingID, content: ''})
                })(),
                signalsToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    // This Block is technically deleted, but we're just testing if we're emitting the right signals
                    return createBlockObj({id: flattenBlocks[0].id, content: ''})
                },
            },
            {
                title: 'User presses backspace at root level with text without children',
                block: (() => {
                    return createBlockObj({id: editingID, content: 'remove this letter: h'})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, content: 'remove this letter: '})
                },
            },
            {
                title: 'User presses backspace at root level without text with children',
                block: (() => {
                    return createBlockObj({id: editingID, content: '', children: [
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, content: '', children: [
                        createBlockObj({id: flattenBlocks[1].id})
                    ]})
                },
            },
            {
                title: 'User presses backspace at second level with text with children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: editingID, content: 'delete this letter: a', children: [
                            createBlockObj(),
                            createBlockObj(),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, content: 'delete this letter: ', children: [
                            createBlockObj({id: flattenBlocks[2]}),
                            createBlockObj({id: flattenBlocks[3]}),
                        ]})
                    ]})
                },
            },
            {
                title: 'User presses backspace at second level without text without children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: newEditID, children: [
                            createBlockObj({id: editingID, content: ''}),
                        ]})
                    ]})
                })(),
                useNewEditID: true,
                signalsToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id})
                    ]})
                },
            },
            {
                title: 'User presses backspace at third level without text with children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID, content: '', children: [
                                createBlockObj(),
                                createBlockObj(),
                            ]}),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, content: '', children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                                createBlockObj({id: flattenBlocks[4].id}),
                            ]})
                        ]})
                    ]})
                },
            },
            {
                title: 'User presses backspace at third level with text without children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID, content: 'delete this letter: g'}),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, content: 'delete this letter: '})
                        ]})
                    ]})
                },
            },
            {
                title: 'User presses backspace at third level with text with children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID, content: 'delete this letter: a', children: [
                                createBlockObj(),
                                createBlockObj(),
                            ]}),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, content: 'delete this letter: ', children: [
                                createBlockObj({id: flattenBlocks[3]}),
                                createBlockObj({id: flattenBlocks[4]}),
                            ]})
                        ]})
                    ]})
                },
            },
            {
                title: 'User presses backspace at third level without text without children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: newEditID, children: [
                            createBlockObj({id: editingID, content: ''}),
                        ]})
                    ]})
                })(),
                useNewEditID: true,
                signalsToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id})
                    ]})
                },
            },
            {
                title: 'User presses backspace at third level without text with children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID, content: '', children: [
                                createBlockObj(),
                                createBlockObj(),
                            ]})
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, content: '', children: [
                            createBlockObj({id: flattenBlocks[1].id, children: [
                                createBlockObj({id: flattenBlocks[2].id}),
                                createBlockObj({id: flattenBlocks[3].id}),
                            ]}),
                        ]})
                    ]})
                },
            },
            {
                title: 'User presses backspace at third level with text without children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({id: editingID, content: 'delete this letter: g'}),
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, content: 'delete this letter: '})
                        ]})
                    ]})
                },
            },
            {
                title: 'User presses backspace in nested Block with text',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj(),
                            ]}),
                            createBlockObj({id: editingID, content: 'delete this letter: a'}),
                            createBlockObj(),
                        ]}),
                        createBlockObj(),
                        createBlockObj(),
                    ]})
                })(),
                signalsToBeEmitted: expectedBlockUpdateSignals,
                signalsNotToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                            ]}),
                            createBlockObj({id: flattenBlocks[4].id, content: 'delete this letter: '}),
                            createBlockObj({id: flattenBlocks[5].id}),
                        ]}),
                        createBlockObj({id: flattenBlocks[6].id}),
                        createBlockObj({id: flattenBlocks[7].id}),
                    ]})
                },
            },
            {
                title: 'User presses backspace in nested Block with text',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj({children: [
                                createBlockObj({id: newEditID}),
                            ]}),
                            createBlockObj({id: editingID, content: ''}),
                            createBlockObj(),
                        ]}),
                        createBlockObj(),
                        createBlockObj(),
                    ]})
                })(),
                useNewEditID: true,
                signalsToBeEmitted: expectedDeleteBlockSignals,
                simulateEventFn: userPressesBackspaceOnInput,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: flattenBlocks[2].id, children: [
                                createBlockObj({id: flattenBlocks[3].id}),
                            ]}),
                            createBlockObj({id: flattenBlocks[5].id}),
                        ]}),
                        createBlockObj({id: flattenBlocks[6].id}),
                        createBlockObj({id: flattenBlocks[7].id}),
                    ]})
                },
            },

            ///
            /// Create a new Block
            ///
            {
                title: 'User presses enter at the end of the second level',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj(),
                        createBlockObj(),
                        createBlockObj({id: editingID})
                    ]})
                })(),
                signalsToBeEmitted: expectedNewBlockSignals,
                simulateEventFn: userPressesEnterOnInput,
                useNewEditID: true,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id}),
                        createBlockObj({id: flattenBlocks[3].id}),
                        createBlockObj({id: newEditID}),
                    ]})
                },
            },
            {
                title: 'User presses enter at the end of the third level',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({children: [
                            createBlockObj(),
                            createBlockObj({id: editingID})
                        ]}),
                    ]})
                })(),
                signalsToBeEmitted: expectedNewBlockSignals,
                simulateEventFn: userPressesEnterOnInput,
                useNewEditID: true,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id}),
                        createBlockObj({id: flattenBlocks[2].id, children: [
                            createBlockObj({id: flattenBlocks[3].id}),
                            createBlockObj({id: newEditID}),
                        ]}),
                    ]})
                },
            },
            {
                title: 'User presses enter on Block with children',
                block: (() => {
                    return createBlockObj({children: [
                        createBlockObj({id: editingID, children: [
                            createBlockObj(),
                            createBlockObj(),
                        ]})
                    ]})
                })(),
                signalsToBeEmitted: expectedNewBlockSignals,
                simulateEventFn: userPressesEnterOnInput,
                useNewEditID: true,
                eventHandlerFn: (flattenBlocks) => {
                    return createBlockObj({id: flattenBlocks[0].id, children: [
                        createBlockObj({id: flattenBlocks[1].id, children: [
                            createBlockObj({id: newEditID}),
                            createBlockObj({id: flattenBlocks[2].id}),
                            createBlockObj({id: flattenBlocks[3].id}),
                        ]}),
                    ]})
                },
            },
        ])('$title', async ({block, signalsToBeEmitted, signalsNotToBeEmitted, useNewEditID, simulateEventFn, eventHandlerFn}) => {
            /**
             * Verify component renders correctly before and after a event happens. Also verifies the correct signals are emitted as well.
             * 
             * 1. mount component and setup structure
             * 2. compare component structure with same Block structure
             *     - Checked Information: Indention level, Block ID order, and CSS styling for indention
             * 3. run event trigger (e.g. "user presses button x") and verify correct signals were emitted
             * 4. handle event trigger ("structure after event should match this output")
             * 5. compare component structure with structure from event handler
             *     - see Checked Information on step 2
             */
            const idPostEvent = (useNewEditID) ? newEditID : editingID
            const wrapper = mountBlockEditor({editingID, blockObj: block})
            expect(wrapper.exists()).toBeTruthy()
            
            let actualFocusedText = wrapper.get(editModeClassSelectorCSS).element.value
            let expectedFocusedText = getTextFromID(editingID, block)
            expect(actualFocusedText).toBe(expectedFocusedText)

            // Verify initial Block structure with rendered structure
            const initialFlattenBlocks = flattenBlockChildren(block).filter(x => x.id !== block.id)
            const expectedPreEvent = getBlockComparisonMetadata(initialFlattenBlocks)
            const initialRenderedChildren = getRenderedChildren(wrapper)
            const actualPreEvent = getComponentComparisonMetadata(initialRenderedChildren)
            expect(actualPreEvent).toStrictEqual(expectedPreEvent)

            // Run simulated event and verify emitted signals
            await simulateEventFn(wrapper)
            expect(wrapper.emitted()).toHaveProperty(signalsToBeEmitted)
            if (signalsNotToBeEmitted) {
                expect(wrapper.emitted()).not.toHaveProperty(signalsNotToBeEmitted)
            }

            // Handle event. BlockEditor delegates this to parents, so we handle it here; we don't do
            //     anything fancy like the actual logic and instead just generate a new root Block
            //     object - pulling relevant information from the original one - for what it should
            //     look like post-event
            const updatedBlock = eventHandlerFn(flattenBlockChildren(block))
            await wrapper.setProps({blockObj: updatedBlock, editingID: idPostEvent})
            await nextTick()
            await flushPromises()
            
            // Verify component structure with rendered structure
            const updatedFlattenBlocks = flattenBlockChildren(updatedBlock).filter(x => x.id !== updatedBlock.id)
            const expectedPostEvent = getBlockComparisonMetadata(updatedFlattenBlocks)
            const latestRenderedChildren = getRenderedChildren(wrapper)
            const actualPostEvent = getComponentComparisonMetadata(latestRenderedChildren)
            expect(actualPostEvent).toStrictEqual(expectedPostEvent)

            // Verify input text matches new selected Block
            actualFocusedText = wrapper.get(editModeClassSelectorCSS).element.value
            expectedFocusedText = getTextFromID(idPostEvent, updatedBlock)
            expect(actualFocusedText).toBe(expectedFocusedText)
        })
    })
})
