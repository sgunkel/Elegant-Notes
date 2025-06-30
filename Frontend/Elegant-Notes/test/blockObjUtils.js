
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
