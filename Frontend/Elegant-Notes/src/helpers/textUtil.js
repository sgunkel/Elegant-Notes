/**
 * textUtil.js
 * 
 * Utility functions for text processing done in the BlockEditor for a better UX and pulling
 *     references. This include auto-pairing symbols (quotes, parenthesis, braces, etc.) and
 *     smart deletion (deleting a pairing symbol in case the user accidentally types the
 *     wrong thing). This also includes helpers that detect if a user is trying to query a
 *     Page or Block and extract the reference query based on the cursor position.
 */

const pairs = {
    '(': ')',
    '[': ']',
    '{': '}',
    '"': '"',
    "'": "'",
    '`': '`',
}

const BlockRefOpeningSymbol = '(('
const BlockRefClosingSymbol = '))'
const PageRefOpeningSymbol = '[['
const PageRefClosingSymbol = ']]'

const referenceOpeningsMap = {
    '((': 'Block',
    '[[': 'Page',
}

const objTypeOpenClosePairMap = {
    'Block': {openSymbol: BlockRefOpeningSymbol, closeSymbol: BlockRefClosingSymbol},
    'Page': {openSymbol: PageRefOpeningSymbol, closeSymbol: PageRefClosingSymbol},
}

const isCursorInsidePair = (text, cursor, open, close) => {
  const left = text.lastIndexOf(open, cursor - 1)
  const right = text.indexOf(close, left + open.length)
  return ((left !== -1 && right !== -1) && (cursor > left && cursor <= right))
}

const extractTextBetweenReferencePair = (text, cursor, openSymbol, closeSymbol) => {
    if (!text) {
        return '' // Text inside pair is empty
    }

    const startIndex = text.lastIndexOf(openSymbol, cursor - 1) + openSymbol.length
    const endIndex = text.indexOf(closeSymbol, startIndex)
    return text.slice(startIndex, endIndex)
}

export const textUtil = {
    handleTextAutoPair(inputElement, event) {
        const openSymbol = event.key
        const closeSymbol = pairs[openSymbol]
        if (!closeSymbol) {
            return
        }

        const { selectionStart, selectionEnd, value } = inputElement
        event.preventDefault()
        inputElement.value =
            value.slice(0, selectionStart) +
            openSymbol +
            closeSymbol +
            value.slice(selectionEnd)

        inputElement.selectionStart = inputElement.selectionEnd = selectionStart + 1
        inputElement.dispatchEvent(new Event('input'))
    },
    handleAutoPairDeletion(inputElement, event) {
        const { selectionStart, selectionEnd, value } = inputElement
        if (selectionStart !== selectionEnd) {
            return
        }

        const prev = value[selectionStart - 1]
        const next = value[selectionStart]
        if (pairs[prev] === next) {
            event.preventDefault()
            inputElement.value =
                value.slice(0, selectionStart - 1) +
                value.slice(selectionStart + 1)
            inputElement.selectionStart = inputElement.selectionEnd = selectionStart - 1
        }
    },
    startedReferenceOpening(inputElement) {
        const { selectionStart, value } = inputElement
        if (selectionStart < 2) {
            return null
        }

        const lastTwo = value.slice(selectionStart - 2, selectionStart)
        return referenceOpeningsMap[lastTwo]
    },
    outsideReferencePair(inputElement) {
        const cursor = inputElement.selectionStart
        const text = inputElement.value
        const insideParens = isCursorInsidePair(text, cursor, BlockRefOpeningSymbol, BlockRefClosingSymbol)
        const insideBrackets = isCursorInsidePair(text, cursor, PageRefOpeningSymbol, PageRefClosingSymbol)
        return !insideParens && !insideBrackets
    },
    extractPageReferenceQuery(inputElement) {
        const cursor = inputElement.selectionStart
        const text = inputElement.value
        return extractTextBetweenReferencePair(text, cursor, PageRefOpeningSymbol, PageRefClosingSymbol)
    },
    extractBlockReferenceQuery(inputElement) {
        const cursor = inputElement.selectionStart
        const text = inputElement.value
        return extractTextBetweenReferencePair(text, cursor, BlockRefOpeningSymbol, BlockRefClosingSymbol)
    },
    replaceSearchQueryWithReference(fullText, reference, cursor, objType) {
        const {openSymbol, closeSymbol} = objTypeOpenClosePairMap[objType]
        const openIndex = fullText.lastIndexOf(openSymbol, cursor - 1)
        if (openIndex === -1) {
            return null
        }

        const closeIndex = fullText.indexOf(closeSymbol, openIndex + openSymbol.length)
        if (closeIndex === -1) {
            return null
        }

        const textBeforeReference = fullText.slice(0, openIndex + openSymbol.length)
        const textAfterReference = fullText.slice(closeIndex)
        const newText = `${textBeforeReference}${reference.id}${textAfterReference}`
        const newCursor = openIndex + openSymbol.length + reference.id.length + closeSymbol.length // Outside reference pair
        return {
            text: newText,
            cursor: newCursor,
        }
    },
}
