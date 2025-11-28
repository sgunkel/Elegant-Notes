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
