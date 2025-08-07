import { blockUtilities } from '@/helpers/blockUtilities.js'
import { assert, describe, expect, it } from 'vitest'

describe('Copy empty Block object list', () => {
    const original = []
    const copy = blockUtilities.createBlocksCopy(original)
    it('Copied version must equal original before modifications', () => expect(copy).toStrictEqual(original))
})

describe('Copy empty Block object list - check modifications do not affect the copy', () => {
    const original = []
    const copy = blockUtilities.createBlocksCopy(original)
    original.push({
        content: 'ab',
        children: [],
    })
    it('Original was modified and should not affect the copy', () => expect(copy).not.toStrictEqual(original))
})

describe('Copy full Block list tests - check values', () => {
    const original = [
        { content: 'a', children: [
            { content: 'b', children: [] }
        ] }
    ]
    const copy = blockUtilities.createBlocksCopy(original)
    it('Copied version must equal original before modifications', () => expect(copy).toStrictEqual(original))
})

describe('Copy full Block list tests - check modifications do not affect copy', () => {
    const original = [
        { content: 'a', children: [
            { content: 'b', children: [] }
        ] }
    ]
    const copy = blockUtilities.createBlocksCopy(original)
    original[0].content = 'b'
    original[0].children[0].content = 'a'
    it('Original was modified and should not affect the copy', () => expect(original).not.toStrictEqual(copy))
})

describe('updateRecursive tests', () => {
    const blockStructure = [
        { id: 'aa', content: 'a', children: [
            { id: 'bb', content: 'b', children: [
                { id: 'cc', content: 'c', children: [] }
            ] },
            { id: 'dd', content: 'd', children: [] }
        ] },
        { id: 'ee', content: 'e', children: [] },
        { id: 'ff', content: 'f', children: [
            { id: 'gg', content: 'g', children: [] },
            { id: 'hh', content: 'h', children: [
                { id: 'ii', content: 'i', children: [] },
            ] },
        ]}
    ]

    it('Nonexistent object', () => {
        const copy = blockUtilities.createBlocksCopy(blockStructure)
        const nonexistentObject = { id: 'does not exist', content: 'blah', children: [] }
        blockUtilities.updateRecursive(copy, nonexistentObject)
        expect(copy).toStrictEqual(blockStructure)
    })

    it('First level update', () => {
        const expected = blockUtilities.createBlocksCopy(blockStructure)
        expected[1].content = 'changed text'

        const actual = blockUtilities.createBlocksCopy(blockStructure)
        const objectToUpdate = { id: 'ee', content: 'changed text', children: [] }
        blockUtilities.updateRecursive(actual, objectToUpdate)
        expect(actual).toStrictEqual(expected)
    })

    it('Second level update', () => {
        const expected = blockUtilities.createBlocksCopy(blockStructure)
        expected[0].children[1].content = 'changed text'
        
        const actual = blockUtilities.createBlocksCopy(blockStructure)
        const objectToUpdate = { id: 'dd', content: 'changed text', children: [] }
        blockUtilities.updateRecursive(actual, objectToUpdate)
        expect(actual).toStrictEqual(expected)
    })

    it('Third level update', () => {
        const expected = blockUtilities.createBlocksCopy(blockStructure)
        expected[2].children[1].children[0].content = 'changed text'

        const actual = blockUtilities.createBlocksCopy(blockStructure)
        const objectToUpdate = { id: 'ii', content: 'changed text', children: [] }
        blockUtilities.updateRecursive(actual, objectToUpdate)
        expect(actual).toStrictEqual(expected)
    })
})
