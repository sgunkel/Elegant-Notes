import { v4 as uuidv4 } from 'uuid'
import { extractBlockReferences, md2json } from './MarkdownJSONUtils'

const idRefListToMap = (idList) => {
    const refMap = {}
    idList.forEach(ref => {
        if (!(ref.block_id in refMap)) {
            refMap[ref.block_id] = []
        }
        refMap[ref.block_id].push(ref)
    })
    return refMap
}

const assignBlockIDsRecursively = (blocks, obj_src_map) => {
    blocks.forEach(block => {
        if (block.id in obj_src_map) {
            block.references = obj_src_map[block.id]
        }
        assignBlockIDsRecursively(block.children, obj_src_map)
    })
}

const createMapWithIdKeys = (blocks, map = {}) => {
    blocks.forEach(block => {
        map[block.id] = block
        createMapWithIdKeys(block.children, map)
    })
    return map
}

const resolveBlockText = (blockID, blockStack, allBlockReferences) => {
    // TODO change the error reporting to be better on the styling i.e. maybe have it a different
    //   color with a tooltip in the future if we can embed html/css here safely
    // TODO change the styling on the substituted text (might also add the JS to go to the page
    //   with the Block being reference when clicked)
    if (blockStack.includes(blockID)) {
        console.log('circular ref detected:', blockStack.join(' -> ') + `-> ${blockID}`)
        return ['CIRCULAR REFERENCE DETECTED', []]
    }

    const idsNotFound = []
    let text = `"${blockID}" NOT FOUND`
    if (blockID in allBlockReferences) {
        let block = allBlockReferences[blockID]
        if (block && 'blockOfInterest' in block) {
            block = block.blockOfInterest
        }
        text = block.content
        const subIDs = extractBlockReferences(text)
        subIDs.forEach(subID => {
            const subBlockStack = [...blockStack, blockID]
            const [subText, subIDsNotFound] = resolveBlockText(subID, subBlockStack, allBlockReferences)
            idsNotFound.push(...subIDsNotFound)
            if ([`"${subID}" NOT FOUND`, 'CIRCULAR REFERENCE DETECTED'].includes(subText)) {
                idsNotFound.push(subID)
            }
            const regex = RegExp(`\\(\\(${subID}\\)\\)`, 'g')
            text = text.replace(regex, `<mark>${subText}</mark>`)
        })
    }
    else {
        idsNotFound.push(blockID)
    }
    return [text, [...new Set(idsNotFound)]]
}

const setAllExternalReferencedBlocks = (root, references, stack = []) => {
    if (stack.includes(root.id)) {
        return
    }

    const currentStack = [...stack, root.id]
    if (!root.externalReferencedBlocks) {
        root.externalReferencedBlocks = {}
    }
    root.externalReferencedBlocks = {...root.externalReferencedBlocks, ...references}
    root.children.forEach(child => setAllExternalReferencedBlocks(child, references, currentStack))
    if (root.references) {
        root.references.forEach(blockRef => setAllExternalReferencedBlocks(blockRef.blockOfInterest, references, currentStack))
    }
}

export const blockUtilities = {
    newID: () => uuidv4(),
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

                updateFn(moved, true) // not actually needed - calls blockUtilities.updateRecursive(), which is used for updating Block content (text). We'll revisit this later...
                idChangeFn(blockId)
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
        // TODO clean this monstrosity up when I have the energy and patience to do so
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
    createNewBlock: () => {
        return {
            id: blockUtilities.newID(),
            content: '',
            children: [],
            indent: 0,
            externalReferencedBlocks: [],
        }
    },
    assignAllBlockReferencesInPage: (rootLevel, references) => {
        if (references.length !== 0) {
            const obj_src_map = idRefListToMap(references)
            assignBlockIDsRecursively(rootLevel, obj_src_map)
        }
    },
    assignBlockReference: (rawContent, rootLevelCopy, referenceProxy) => {
        let blockIndex = 0
        let lineIndex = 0
        const referenceLineIndex = referenceProxy.actual.line_number - 1
        const lines = rawContent.split('\n')
        lines.forEach(line => {
            const justContent = line.trim().replace(/^- /, '')
            console.log(lineIndex, line, '->', justContent)
            if (!justContent.startsWith('id:: ') && lineIndex < referenceLineIndex) {
                blockIndex++
            }
            lineIndex++
        })

        const flattenBlocks = blockUtilities.flattenBlocks(rootLevelCopy)
        const blockProxy = flattenBlocks[blockIndex]
        if (blockProxy) {
            blockProxy.writeIDToFile = true
            referenceProxy.id = blockProxy.id
            console.log('added id to reference')
            return true
        }
        console.log('could not assign block reference')
        return false
    },
    extractBlocksFromReferences: (references) => {
        return new Promise((resolve, reject) => {
            // TODO should we really support a timeout feature?
            setTimeout(() => reject('Timed out when parsing references'), 10000) // 10 seconds good enough?

            // TODO should we do a full-stop if that fails? i.e. file was not in the correct format?
            // TODO this can benefit by running in parallel
            references.forEach(ref => {
                const rootLevel = md2json(ref.content)
                ref.blockStructure = rootLevel
            })
            resolve(references)
        })
    },
    applyReferencesToRootLevelBlocks: (rootLevelBlocks, backlinksProxy, references, idsOutsideBlockRequested = false) => {
        const createRefObject = (ref, meta, flatArray) => {
            return {
                blockOfInterest: flatArray[meta.block_index],
                ref,
                meta,
            }
        }
        const rootLevelMap = createMapWithIdKeys(rootLevelBlocks)
        const externalReferencedBlocks = {}
        references.forEach(reference => {
            const flattenBlocks = blockUtilities.flattenBlocks(reference.blockStructure.rootLevel)

            // Block references - Blocks IDs in the active page that are referenced in other Page
            //     objects.
            reference.blocksInsidePage.forEach(block => {
                if (idsOutsideBlockRequested) {
                    const blockId = flattenBlocks[block.block_index].id
                    externalReferencedBlocks[blockId] = createRefObject(reference, block, flattenBlocks)
                }
                else {
                    if (block.ref_id in rootLevelMap) {
                        if (!rootLevelMap[block.ref_id].references) {
                            rootLevelMap[block.ref_id].references = []
                        }
                        rootLevelMap[block.ref_id].references.push(createRefObject(reference, block, flattenBlocks))
                    }
                }
            })

            // Externally referenced Blocks - Block text has one or more `((<Block ID>))` in it
            //     where `<Block ID>` is assigned in another Page object.
            reference.blocksOutsidePage.forEach(block => {
                const blockId = flattenBlocks[block.block_index].id
                externalReferencedBlocks[blockId] = createRefObject(reference, block, flattenBlocks)
            })

            // Backlinks - linkage to Page objects
            reference.backlinks.forEach(backlink => {
                console.log(backlink.block_index, flattenBlocks[backlink.block_index], flattenBlocks)
                backlinksProxy.push(createRefObject(reference, backlink, flattenBlocks))
            })
        })

        // Apply all the external references to all the Blocks
        if (Object.keys(externalReferencedBlocks).length > 0) {
            Object.keys(rootLevelMap).forEach(blockID => {
                setAllExternalReferencedBlocks(rootLevelMap[blockID], externalReferencedBlocks)
            })
            backlinksProxy.forEach(backlink => {
                setAllExternalReferencedBlocks(backlink.blockOfInterest, externalReferencedBlocks)
            })
        }
    },
    resolveBlockReferences: (rootBlock, allReferences) => {
        // Changes the following
        //   Check out ((<Block ID>)) for more info
        // to
        //   Check out <mark><Block text></mark> for more info
        //
        // In the future, this will replace the text to a link where we can click on the Block
        //     text and get taken to its Page object and have that Block be briefly highlighted.
        // Note that this automatically resolves all Block references, including references in
        //     references i.e. Block 1 references Block 2 and Block 2 references Block 3, and so
        //     forth; this will recursively fetch all referenced IDs until everything is found.
        //     What isn't found in the `allReferences` is returned for PageEditor to request
        //     from the backend, and will call this function again with the new references.
        allReferences[rootBlock.id] = rootBlock
        const info = resolveBlockText(rootBlock.id, [], allReferences)
        delete allReferences[rootBlock.id]
        return info
    },
}
