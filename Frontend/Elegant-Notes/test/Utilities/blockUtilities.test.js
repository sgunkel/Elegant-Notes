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

describe('flattenBlocks tests', () => {
    it('Empty root level', () => {
        const expected = []
        const actual = blockUtilities.flattenBlocks([])
        expect(actual).toStrictEqual(expected)
    })

    it('single level', () => {
        const blocks = [
            { content: 'a', children: [] },
            { content: 'b', children: [] },
            { content: 'c', children: [] },
        ]
        const expected = blocks // just a single level, so it shouldn't matter
        const actual = blockUtilities.flattenBlocks(blocks)
        expect(actual).toStrictEqual(expected)
    })

    it('two levels', () => {
        const given = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [] },
            ] },
            { id: 'cc', content: 'c', children: [] },
        ]
        const expected = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [] },
            ] },
            { id: 'bb', content: 'b', children: [] },
            { id: 'cc', content: 'c', children: [] },
        ]
        const actual = blockUtilities.flattenBlocks(given)
        expect(actual).toStrictEqual(expected)
    })

    it('Three levels', () => {
        const given = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [
                    { id: 'cc', content: 'c', children: [] },
                ] },
            ] },
            { id: 'dd', content: 'd', children: [] },
        ]
        const expected = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [
                    { id: 'cc', content: 'c', children: [] },
                ] },
            ] },
            { id: 'bb', content: 'b', children: [
                    { id: 'cc', content: 'c', children: [] },
            ] },
            { id: 'cc', content: 'c', children: [] },
            { id: 'dd', content: 'd', children: [] },
        ]
        const actual = blockUtilities.flattenBlocks(given)
        expect(actual).toStrictEqual(expected)
    })

    it('Varying levels', () => {
        const given = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [
                    { id: 'cc', content: 'c', children: [] },
                ] },
                { id: 'dd', content: 'd', children: [] },
            ] },
            { id: 'ee', content: 'e', children: [] },
            { id: 'ff', content: 'f', children: [
                { id: 'g', content: 'g', children: [
                    { id: 'hh', content: 'h', children: [] },
                    { id: 'ii', content: 'i', children: [] },
                ] },
            ] },
            { id: 'jj', content: 'j', children: [] },
        ]
        const expected = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [
                    { id: 'cc', content: 'c', children: [] },
                ] },
                { id: 'dd', content: 'd', children: [] },
            ] },
            { id: 'bb', content: 'b', children: [
                { id: 'cc', content: 'c', children: [] },
            ] },
            { id: 'cc', content: 'c', children: [] },
            { id: 'dd', content: 'd', children: [] },
            { id: 'ee', content: 'e', children: [] },
            { id: 'ff', content: 'f', children: [
                { id: 'g', content: 'g', children: [
                    { id: 'hh', content: 'h', children: [] },
                    { id: 'ii', content: 'i', children: [] },
                ] },
            ] },
            { id: 'g', content: 'g', children: [
                { id: 'hh', content: 'h', children: [] },
                { id: 'ii', content: 'i', children: [] },
            ] },
            { id: 'hh', content: 'h', children: [] },
            { id: 'ii', content: 'i', children: [] },
            { id: 'jj', content: 'j', children: [] },
        ]
        const actual = blockUtilities.flattenBlocks(given)
        expect(actual).toStrictEqual(expected)
    })
})

describe('insertAfterRecursive tests', () => {
    const singleLevelBlocks = [
        { id: 'aa', content: 'a', children: [] },
        { id: 'bb', content: 'b', children: [] },
        { id: 'cc', content: 'c', children: [] },
    ]
    const duelLevelBlocks = [
        { id: 'aa', content: 'a', children: [
            { id: 'bb', content: 'b', children: [] },
            { id: 'cc', content: 'c', children: [] },
            { id: 'dd', content: 'd', children: [] },
        ] },
    ]
    const tripleLevelBlocks = [
        { id: 'aa', content: 'a', children: [
            { id: 'bb', content: 'b', children: [
                { id: 'cc', content: 'c', children: [] },
                { id: 'dd', content: 'd', children: [] },
            ] },
        ] },
    ]
    const varyingLevels = [
        { id: 'aa', content: 'a', children: [
            { id: 'bb', content: 'b', children: [] },
            { id: 'cc', content: 'c', children: [
                { id: 'dd', content: 'd', children: [] },
            ] },
        ] },
        { id: 'ee', content: 'e', children: [] },
        { id: 'ff', content: 'f', children: [
            { id: 'gg', content: 'g', children: [] },
            { id: 'hh', content: 'h', children: [] },
            { id: 'ii', content: 'i', children: [
                { id: 'jj', content: 'j', children: [
                    { id: 'kk', content: 'k', children: [] },
                    { id: 'll', content: 'l', children: [] },
                    { id: 'mm', content: 'm', children: [] },
                ] },
                { id: 'nn', content: 'n', children: [
                    { id: 'oo', content: 'o', children: [] },
                    { id: 'pp', content: 'p', children: [] },
                ] },
            ] },
        ] },
    ]

    it('One level at the end', () => {
        const newBlock = { id: 'dd', content: 'd', children: [] }
        const expected = blockUtilities.createBlocksCopy(singleLevelBlocks)
        expected.push(newBlock)

        const actual = blockUtilities.createBlocksCopy(singleLevelBlocks)
        const success = blockUtilities.insertAfterRecursive(actual, newBlock, 'cc')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it('One level in the middle', () => {
        const newBlock = { id: 'dd', content: 'd', children: [] }
        const expected = blockUtilities.createBlocksCopy(singleLevelBlocks)
        expected.splice(1, 0, newBlock)

        const actual = blockUtilities.createBlocksCopy(singleLevelBlocks)
        const success = blockUtilities.insertAfterRecursive(actual, newBlock, 'aa')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it ('Two levels at the end', () => {
        const newBlock = { id: 'ee', content: 'e', children: [] }
        const expected = blockUtilities.createBlocksCopy(duelLevelBlocks)
        expected[0].children.push(newBlock)

        const actual = blockUtilities.createBlocksCopy(duelLevelBlocks)
        const success = blockUtilities.insertAfterRecursive(actual, newBlock, 'dd')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it('Two levels in the middle', () => {
        const newBlock = { id: 'ee', content: 'e', children: [] }
        const expected = blockUtilities.createBlocksCopy(duelLevelBlocks)
        expected[0].children.splice(2, 0, newBlock)

        const actual = blockUtilities.createBlocksCopy(duelLevelBlocks)
        const success = blockUtilities.insertAfterRecursive(actual, newBlock, 'cc')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it('Three levels at the end', () => {
        const newBlock = { id: 'ee', content: 'e', children: [] }
        const expected = blockUtilities.createBlocksCopy(tripleLevelBlocks)
        expected[0].children[0].children.push(newBlock)

        const actual = blockUtilities.createBlocksCopy(tripleLevelBlocks)
        const success = blockUtilities.insertAfterRecursive(actual, newBlock, 'dd')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })
    
    it('Three levels in the middle', () => {
        const newBlock = { id: 'ee', content: 'e', children: [] }
        const expected = blockUtilities.createBlocksCopy(tripleLevelBlocks)
        expected[0].children[0].children.splice(1, 0, newBlock)

        const actual = blockUtilities.createBlocksCopy(tripleLevelBlocks)
        const success = blockUtilities.insertAfterRecursive(actual, newBlock, 'cc')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it('Varying levels & multiple inserts', () => {
        const afterBB = { id: '123', content: 'after bb', children: [] }
        const afterEE = { id: '456', content: 'after ee', children: [] }
        const afterKK = { id: '789', content: 'after kk', children: [] }
        const afterNN = { id: '987654321', content: 'after nn', children: [] }

        const expected = blockUtilities.createBlocksCopy(varyingLevels)
        expected[0].children.splice(1, 0, afterBB)
        expected.splice(2, 0, afterEE)
        expected[3].children[2].children[0].children.splice(1, 0, afterKK)
        expected[3].children[2].children[1].children.unshift(afterNN)

        const actual = blockUtilities.createBlocksCopy(varyingLevels)
        const successFirstInsert = blockUtilities.insertAfterRecursive(actual, afterBB, 'bb')
        const successSecondInsert = blockUtilities.insertAfterRecursive(actual, afterEE, 'ee')
        const successThirdInsert = blockUtilities.insertAfterRecursive(actual, afterKK, 'kk')
        const successForthInsert = blockUtilities.insertAfterRecursive(actual, afterNN, 'nn')

        expect(successFirstInsert).toBeTruthy()
        expect(successSecondInsert).toBeTruthy()
        expect(successThirdInsert).toBeTruthy()
        expect(successForthInsert).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    // TODO add tests for failure to insert (invalid ID case)
})

describe('deleteByID tests', () => {
    /*
     * NOTE: current implementation for deleteByID assumes the object to delete does
     *   *not* contain children. Henceforth, no test will have an object that contains
     *   children *yet*.
     */

    it('Single level', () => {
        const blocks = [
            { id: 'aa', content: 'a', children: [] },
            { id: 'bb', content: 'b', children: [] },
            { id: 'cc', content: 'c', children: [] },
        ]
        const expected = blockUtilities.createBlocksCopy(blocks)
        expected.splice(1, 1)

        const actual = blockUtilities.createBlocksCopy(blocks)
        const success = blockUtilities.deleteByID(actual, 'bb')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it('Duel level', () => {
        const blocks = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [] },
                { id: 'cc', content: 'c', children: [] },
            ] },
            { id: 'dd', content: 'd', children: [] },
        ]
        const expected = blockUtilities.createBlocksCopy(blocks)
        expected[0].children.splice(0, 1)

        const actual = blockUtilities.createBlocksCopy(blocks)
        const success = blockUtilities.deleteByID(actual, 'bb')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    it('Triple level', () => {
        const blocks = [
            { id: 'aa', content: 'a', children: [
                { id: 'bb', content: 'b', children: [
                    { id: 'cc', content: 'c', children: [] },
                ] },
            ] },
            { id: 'dd', content: 'd', children: [] },
        ]
        const expected = blockUtilities.createBlocksCopy(blocks)
        expected[0].children[0].children.splice(0, 1)

        const actual = blockUtilities.createBlocksCopy(blocks)
        const success = blockUtilities.deleteByID(actual, 'cc')

        expect(success).toBeTruthy()
        expect(actual).toStrictEqual(expected)
    })

    // TODO add tests for failure to delete (invalid ID case)
})
