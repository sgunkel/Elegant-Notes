import { blockUtilities } from '@/helpers/blockUtilities.js'
import { describe, expect, it } from 'vitest'

describe('createBlocksCopy tests', () => {
    const emptyList = []
    const fullList = [
        { content: 'a', children: [
            { content: 'b', children: [] }
        ] }
    ]

    it('Empty Block list', () => {
        const copy = blockUtilities.createBlocksCopy(emptyList)
        expect(copy).toStrictEqual(emptyList)
    })

    it('Add to empty list', () => {
        const copy = blockUtilities.createBlocksCopy(emptyList)
        copy.push({
            content: 'ab',
            children: [],
        })
        expect(copy).not.toStrictEqual(emptyList)
    })

    it('Full Block list', () => {
        const copy = blockUtilities.createBlocksCopy(fullList)
        expect(copy).toStrictEqual(fullList)
    })

    it('Modify full Block list after copy', () => {
        const copy = blockUtilities.createBlocksCopy(fullList)
        copy[0].content = 'b'
        copy[0].children[0].content = 'a'
        expect(fullList).not.toStrictEqual(copy)
    })
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
