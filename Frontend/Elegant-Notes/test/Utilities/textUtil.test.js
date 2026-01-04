// @vitest-environment happy-dom

/**
 * Tests for /helpers/textUtil.js
 * 
 * There are several use cases for some of these text utilities, including whether
 *     there are words before and/or after the reference pair, if the words next to
 *     the pair have a space between them or not, etc. This file generates a set of
 *     use cases **per opening/closing/reference symbols** and thus has a few hundred
 *     tests alone.
 */

import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'

import { v4 as uuidv4 } from 'uuid'

import { textUtil } from '@/helpers/textUtil'

import { makeTestCasesWithSurroundingText } from '../blockObjUtils'

const pairs = [
    {openingSymbol: '(', closingSymbol: ')'},
    {openingSymbol: '[', closingSymbol: ']'},
    {openingSymbol: '{', closingSymbol: '}'},
    {openingSymbol: '"', closingSymbol: '"'},
    {openingSymbol: "'", closingSymbol: "'"},
    {openingSymbol: '`', closingSymbol: '`'},
]
const blockRefPairWithObjMeta = {openSymbols: '((', closeSymbols: '))', objType: 'Block'}
const pageRefPairWithObjMeta = {openSymbols: '[[', closeSymbols: ']]', objType: 'Page'}
const fullRefPairWithObjMeta = [
    blockRefPairWithObjMeta,
    pageRefPairWithObjMeta,
]
const blockQuery = 'block query text'
const pageQuery = 'page query text'
const blockQueryUseCases = [{content: blockQuery}]
const pageQueryUseCases = [{content: pageQuery}]
const allSymbols = [blockRefPairWithObjMeta, pageRefPairWithObjMeta]
    .concat(pairs)
    .concat(blockQueryUseCases.map(x => {return {content: `((${x.content}))`}}))
    .concat(pageQueryUseCases.map(x => {return {content:`[[${x.content}]]`}}))
const pairTestCases = makeTestCasesWithSurroundingText(pairs, allSymbols)
const fullRefPairTestCases = makeTestCasesWithSurroundingText(fullRefPairWithObjMeta, allSymbols)
const blockQueryToReplace = makeTestCasesWithSurroundingText(blockQueryUseCases, allSymbols)
const pageQueryToReplace = makeTestCasesWithSurroundingText(pageQueryUseCases, allSymbols)

/**
 * Some functions take an <input> directly, so we generate a simple component that only has it. Future
 *     versions will likely refactor and not take an <input> directly.
 */
const createInputElement = () => {
    const dummyComponent = {
        template: '<div><input v-model="content"/></div>',
        data: () => {content: ''},
    }
    return mount(dummyComponent).get('input')
}

describe('textUtil tests', () => {
    describe('handleTextAutoPair', () => {
        test.each(pairTestCases)('Use case: |$textBefore|$openingSymbol|CURSOR|$closingSymbol|$textAfter|',
                async ({openingSymbol, closingSymbol, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length
            const expectedCursorPosPostAction = textBefore.length + openingSymbol.length
            const initialText = `${textBefore}${textAfter}`
            const expectedText = `${textBefore}${openingSymbol}${closingSymbol}${textAfter}`

            await input.setValue(initialText)
            input.element.selectionStart = input.element.selectionEnd = cursorPos
            await input.trigger('keydown', {key: openingSymbol})

            const mockPreventDefault = vi.fn()
            const mockEvent = {
                key: openingSymbol,
                preventDefault: mockPreventDefault,
            }

            textUtil.handleTextAutoPair(input.element, mockEvent)
            
            // '' -> '()'
            //  ^      ^
            // Cursor does not move past closing symbol
            expect(input.element.selectionStart).toBe(expectedCursorPosPostAction)
            expect(input.element.value).toBe(expectedText)
            expect(mockPreventDefault).toHaveBeenCalled()
        })
    })

    describe('handleAutoPairDeletion', () => {
        test.each(pairTestCases)('Use case: |$textBefore|$openingSymbol|CURSOR|$closingSymbol|$textAfter|',
                async ({openingSymbol, closingSymbol, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + openingSymbol.length
            const expectedCursorPosPostAction = textBefore.length
            const initialText = `${textBefore}${openingSymbol}${closingSymbol}${textAfter}`
            const expectedText = `${textBefore}${textAfter}`

            await input.setValue(initialText)
            input.element.selectionStart = input.element.selectionEnd = cursorPos
            await input.trigger('keydown', {key: 'Backspace'})

            const mockPreventDefault = vi.fn()
            const mockEvent = {
                key: openingSymbol,
                preventDefault: mockPreventDefault,
            }

            textUtil.handleAutoPairDeletion(input.element, mockEvent)

            expect(input.element.selectionStart).toBe(expectedCursorPosPostAction)
            expect(input.element.value).toBe(expectedText)
            expect(mockPreventDefault).toHaveBeenCalled()
        })
    })

    describe('startedReferenceOpening', () => {
        test.each(fullRefPairTestCases)('Reference should be detected inside pair; Use case: |$textBefore|$openSymbols|CURSOR|$closeSymbols|$textAfter|',
                ({openSymbols, closeSymbols, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + openSymbols.length
            input.setValue(`${textBefore}${openSymbols}${closeSymbols}${textAfter}`)
            input.element.selectionStart = input.element.selectionEnd = cursorPos

            const actual = textUtil.startedReferenceOpening(input.element)

            expect(actual).toBeTruthy()
        })

        test.each(fullRefPairTestCases)('Reference should not be detected outside (pre & post) pair; Use case: |$textBefore|$openSymbols|CURSOR|$closeSymbols|$textAfter|',
                ({openSymbols, closeSymbols, textBefore, textAfter}) => {
            const input = createInputElement()
            const preRefPos = textBefore.length
            const postRefPos = textBefore.length + openSymbols.length + closeSymbols.length
            input.setValue(`${textBefore}${openSymbols}${closeSymbols}${textAfter}`)

            // Pre reference pair
            input.element.selectionStart = input.element.selectionEnd = preRefPos
            const preActual = textUtil.startedReferenceOpening(input.element)
            expect(preActual).not.toBeTruthy()

            // Post reference pair
            input.element.selectionStart = input.element.selectionEnd = postRefPos
            const postActual = textUtil.startedReferenceOpening(input.element)
            expect(postActual).not.toBeTruthy()
        })
    })

    describe('outsideReferencePair', () => {
        test.each(fullRefPairTestCases)('Cursor inside reference pair; Use case: |$textBefore|$openSymbols|CURSOR|$closeSymbols|$textAfter|',
                ({openSymbols, closeSymbols, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + openSymbols.length
            input.setValue(`${textBefore}${openSymbols}${closeSymbols}${textAfter}`)
            input.element.selectionStart = input.element.selectionEnd = cursorPos

            const actual = textUtil.outsideReferencePair(input.element)

            expect(actual).not.toBeTruthy()
        })

        test.each(fullRefPairTestCases)('Cursor outside (pre & post) pair; Use case: |$textBefore|$openSymbols|CURSOR|$closeSymbols|$textAfter|',
                ({openSymbols, closeSymbols, textBefore, textAfter}) => {
            const input = createInputElement()
            const preRefPos = textBefore.length
            const postRefPos = textBefore.length + openSymbols.length + closeSymbols.length
            input.setValue(`${textBefore}${openSymbols}${closeSymbols}${textAfter}`)

            // Pre reference pair
            input.element.selectionStart = input.element.selectionEnd = preRefPos
            const preActual = textUtil.outsideReferencePair(input.element)
            expect(preActual).toBeTruthy()

            // Post reference pair
            input.element.selectionStart = input.element.selectionEnd = postRefPos
            const postActual = textUtil.outsideReferencePair(input.element)
            expect(postActual).toBeTruthy()
        })
    })

    describe('extractPageReferenceQuery', () => {
        const useCases = makeTestCasesWithSurroundingText([pageRefPairWithObjMeta], allSymbols)
        const searchQuery = 'some page name'
        test.each(useCases)('Extract page reference; use case: |$textBefore|$openSymbols|CURSOR|$closeSymbols|$textAfter|',
                ({openSymbols, closeSymbols, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + openSymbols.length + searchQuery.length
            input.setValue(`${textBefore}${openSymbols}${searchQuery}${closeSymbols}${textAfter}`)
            input.element.selectionStart = input.element.selectionEnd = cursorPos

            const actualExtracted = textUtil.extractPageReferenceQuery(input.element)

            expect(actualExtracted).toBe(searchQuery)
        })
    })

    describe('extractBlockReferenceQuery', () => {
        const useCases = makeTestCasesWithSurroundingText([blockRefPairWithObjMeta], allSymbols)
        const searchQuery = 'some block text to search for'
        test.each(useCases)('Extract block reference; use case: |$textBefore|$openSymbols|CURSOR|$closeSymbols|$textAfter|',
                ({openSymbols, closeSymbols, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + openSymbols.length + searchQuery.length
            input.setValue(`${textBefore}${openSymbols}${searchQuery}${closeSymbols}${textAfter}`)
            input.element.selectionStart = input.element.selectionEnd = cursorPos

            const actualExtracted = textUtil.extractBlockReferenceQuery(input.element)

            expect(actualExtracted).toBe(searchQuery)
        })
    })

    describe('replaceSearchQueryWithReference', () => {
        test.each(blockQueryToReplace)('Replace Block reference query with Block entry (ID); use case: |$textBefore|$content|$textAfter|',
                ({content, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + content.length + 2 // +2 for `((`
            input.setValue(`${textBefore}((${content}))${textAfter}`)
            input.element.selectionStart = input.element.selectionEnd = cursorPos

            const reference = {
                id: uuidv4(),
            }
            const expectedCursor = textBefore.length + 4 + reference.id.length // +4 to be outside reference pair
            const expectedText = `${textBefore}((${reference.id}))${textAfter}`

            const actual = textUtil.replaceSearchQueryWithReference(input.element.value, reference, cursorPos, 'Block')

            expect(actual.text).toBe(expectedText)
            expect(actual.cursor).toBe(expectedCursor)
        })

        test.each(pageQueryToReplace)('Replace Page reference query with Page entry (Page name); use case: |$textBefore|$content|$textAfter|',
                ({content, textBefore, textAfter}) => {
            const input = createInputElement()
            const cursorPos = textBefore.length + content.length + 2 // +2 for `((`
            input.setValue(`${textBefore}[[${content}]]${textAfter}`)
            input.element.selectionStart = input.element.selectionEnd = cursorPos

            const expectedPageName = 'Something different than the query'
            const reference = {
                id: expectedPageName,
            }
            const expectedCursor = textBefore.length + 4 + reference.id.length // +4 to be outside reference pair
            const expectedText = `${textBefore}[[${expectedPageName}]]${textAfter}`

            const actual = textUtil.replaceSearchQueryWithReference(input.element.value, reference, cursorPos, 'Page')

            expect(actual.text).toBe(expectedText)
            expect(actual.cursor).toBe(expectedCursor)
        })
    })
})
