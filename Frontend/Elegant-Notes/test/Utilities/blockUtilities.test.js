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
