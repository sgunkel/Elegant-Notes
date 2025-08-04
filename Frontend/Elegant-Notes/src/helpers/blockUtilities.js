
export const blockUtilities = {
    createBlocksCopy: (originalBlocks) => JSON.parse(JSON.stringify(originalBlocks)),
    updateRecursive: (blocks, updatedBlock) => {
        blocks.forEach(block => {
            if (block.id === updatedBlock.id) {
                block.content = updatedBlock.content
            } else if (block.children) {
                blockUtilities.updateRecursive(block.children, updatedBlock)
            }
        })
    },
    flattenBlocks: (blocks, flatList = []) => {
        blocks.forEach(block => {
            flatList.push(block)
            if (block.children.length > 0) {
                blockUtilities.flattenBlocks(block.children, flatList)
            }
        })
        return flatList
    },
    insertAfterRecursive: (blocks, newBlock, targetId) => {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            if (block.id === targetId) {
                // New entry should be the first child if the block already has
                //   children - seems more natural
                if (block.children.length > 0) {
                    block.children.unshift(newBlock);
                } else {
                    // Insert the new entry as a sibling
                    blocks.splice(i + 1, 0, newBlock);
                }
                return true;
            } else if (block.children) {
                const inserted = blockUtilities.insertAfterRecursive(block.children, newBlock, targetId)
                if (inserted) { return true }
            }
        }
        return false
    },
    deleteByID: (blocks, targetID) => {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            if (block.id === targetID) {
                // assume we have already checked that the given Block does **not** have children
                blocks.splice(i, 1)
                return true
            }
            else if (block.children && blockUtilities.deleteByID(block.children, targetID)) {
                return true
            }
        }
        return false
    },
    indent: (blockId, blocks, newText, updateFn, idChangeFn) => {
        for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i];
            if (block.id === blockId && i > 0) {
                const prev = blocks[i - 1];
                if (!prev.children) prev.children = []
                
                const [moved] = blocks.splice(i, 1);
                prev.children.push(moved);

                updateFn(moved, true) // this.handleUpdate(moved, true);
                idChangeFn(blockId) // this.editingId = blockId;
                if (newText !== undefined) {
                    moved.content = newText
                }
                return true;
            }
            if (block.children && blockUtilities.indent(blockId, block.children, newText, updateFn, idChangeFn)) return true;
        }
        return false;
    },
    outdentRecursive: (blocksCopy, blockId, newText) => {
        let movedBlock = null;
        const innerOutdentRecursive = (
            blocks,
            parent = null,
            parentArray = null,
            grandparent = null,
            grandparentArray = blocksCopy
        ) => {
            for (let i = 0; i < blocks.length; i++) {
                const block = blocks[i];

                if (block.id === blockId && parent !== null && parentArray !== null) {
                    // 1. Grab the outdented block and the trailing siblings
                    const removed = parentArray.splice(i, 1)[0];
                    const trailingSiblings = parentArray.splice(i); // all after 'c'

                    // 2. Move trailing siblings into 'removed.children'
                    removed.children = removed.children.concat(trailingSiblings);

                    if (newText !== undefined) {
                        removed.content = newText;
                    }

                    // 3. Find the index of parent in grandparent array
                    const parentIndex = grandparentArray.findIndex(b => b.id === parent.id);
                    if (parentIndex !== -1) {
                        grandparentArray.splice(parentIndex + 1, 0, removed);
                    } else {
                        // fallback
                        blocksCopy.push(removed);
                    }

                    movedBlock = removed;
                    return true;
                }

                if (block.children?.length > 0) {
                    if (
                        innerOutdentRecursive(
                            block.children,
                            block,
                            block.children,
                            parent,
                            parentArray || blocksCopy
                        )
                    ) {
                        return true;
                    }
                }
            }
            return false;
        }
        return [innerOutdentRecursive(blocksCopy), movedBlock, blocksCopy]
    },
}