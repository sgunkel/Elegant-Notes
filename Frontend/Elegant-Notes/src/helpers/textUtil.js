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
    startedReferenceOpening(inputElement) {
        const { selectionStart, value } = inputElement
        if (selectionStart < 2) return null

        const lastTwo = value.slice(selectionStart - 2, selectionStart)
        return referenceOpeningsMap[lastTwo]

        // if (lastTwo === '((') return 'block'
        // if (lastTwo === '[[') return 'page'
        // return null
    },
}
