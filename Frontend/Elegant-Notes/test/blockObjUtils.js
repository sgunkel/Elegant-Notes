import { v4 as uuidv4 } from 'uuid'

/**
 * Helper that removes the ID from a Block and its children.
 */
const recursivelyRemoveIDsFromBlock = (blockObj) => {
    return {
        content: blockObj.content,
        indent: blockObj.indent,
        children: blockObj.children.map(obj => recursivelyRemoveIDsFromBlock(obj))
    }
}

/**
 * Helper that removes all the IDs from a list of Block objects.
 */
export const removeIDsFromBlockObjects = (blockList) => {
    return blockList.map(obj => recursivelyRemoveIDsFromBlock(obj))
}

/**
 * Helper function to generate Block objects. Overwrite any value by passing an array
 *     with the fields to change.
 * 
 * @param {Object} args Block values to overwrite
 * @returns Block object - default with the text "Hello World" and no children
 */
export const createBlockObj = (args = {}) => {
    const id = args?.id || uuidv4()
    return {
        id,
        content: `Hello World from Block with ID **${id}**`,
        children: [],
        ...args
    }
}

export const flattenBlockChildren = (block) => {
    return flattenBlocks([block])
}

// just a shameful copy from blockUtilities.js with `indention` field mode
const flattenBlocks = (blocks, indention = 0) => {
    const flatList = []
    blocks.forEach(block => {
        flatList.push({indentionLevel: indention, ...block})
        if (block.children.length > 0) {
            const children = flattenBlocks(block.children, indention + 1)
            flatList.push(...children)
        }
    })
    return flatList
}

const textContentCases = [
    '',               // Nothing before and/or after reference pair use case
    'no space',       // Content before and/or after reference pair with no space use case
    ' space around ', // Content before and/or after reference pair with space use case
]

/**
 * (Absurd) Use cases around references when the user is typing.
 * Case format:
 *  - <pair>
 *  - <pair>words
 *  - <pair> words
 *  - <pair> <other pairs>
 *  - words<pair>
 *  - words<pair>words
 *  - words<pair> words
 *  - words<pair> <other pairs>
 *  - words <pair>
 *  - words <pair>words
 *  - words <pair> words
 *  - words <pair> <other pairs>
 *  - <other pairs> <pair>
 *  - <other pairs> <pair>words
 *  - <other pairs> <pair> words
 *  - <other pairs> <pair> <other pairs>
 * Note that we test when there's a space or not between a pair and words. This is used for where the cursor lands in some tests
 */
export const makeTestCasesWithSurroundingText = (given, otherPairs) => given.flatMap(pair => {
    const contentUserCases = [...textContentCases] // Create a copy of `testContentCases` - messes stuff up otherwise
    // All opening/closing symbol pairs converted to a single string for pre- and post- reference/pair tests
    const withOtherPairs = otherPairs.map(pair => {
        return (((pair.openingSymbol || pair.openSymbols) + (pair.closingSymbol || pair.closeSymbols)) || pair.content)
    }).filter(x => x).join(' ')
    contentUserCases.push(withOtherPairs)

    const prependedText = contentUserCases.map(text => {
        return {
            ...pair,
            textBefore: text,
        }
    })
    const appendedText = prependedText.flatMap(x => {
        return contentUserCases.map(text => {
            return {
                ...x, // Has the open/close reference symbols
                textAfter: text,
            }
        })
    })
    return [...new Set(appendedText)]
})
