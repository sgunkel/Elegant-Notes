/**
 * textUtil.js
 * 
 * Utility functions for text processing done in the BlockEditor for a better UX and pulling
 *     references.
 */

const pairs = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
}

const referenceOpeningsMap = {
    '((': 'Block',
    '[[': 'Page',
}

const isCursorInsidePair = (text, cursor, open, close) => {
  const left = text.lastIndexOf(open, cursor - 1)
  const right = text.indexOf(close, left + open.length)
  return ((left !== -1 && right !== -1) && (cursor > left && cursor <= right))
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
        if (selectionStart < 2) return null

        const lastTwo = value.slice(selectionStart - 2, selectionStart)
        return referenceOpeningsMap[lastTwo]
    },
    outsideReferencePair(inputElement) {
        const cursor = inputElement.selectionStart
        const text = inputElement.value
        const insideParens = isCursorInsidePair(text, cursor, '((', '))')
        const insideBrackets = isCursorInsidePair(text, cursor, '[[', ']]')
        return !insideParens && !insideBrackets
    },
}
