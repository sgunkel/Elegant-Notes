import MarkdownIt from 'markdown-it'
import { blockUtilities } from './blockUtilities'
import { textConstants } from '@/constants/textConstants'

const mdFlags = {
    html: true, // might be a security concern and we should revisit this
}
const md = new MarkdownIt(mdFlags)
// TODO add rules for changing Block references to links that go to that reference
export default md

// Since we're using this outside this file now, it might be best to place it somewhere else that
//     makes sense
export const extractBlockReferences = (blockText) => {
    // Note: matches is an array of arrays - nested arrays have one string in them
    const matches = [...blockText.matchAll(textConstants.blockRefRegex)]
    const extractedIDs = matches.map(x => x[0].replaceAll(textConstants.blockRefPairRemovalRegex, ''))
    return extractedIDs
}

const extractBlockIndention = (line) => line.match(textConstants.blockIndentionRegex)[0].length

const extractIdFromText = (blockText) => blockText.replace(textConstants.blockIdAssignmentRemoval, '').trim()

export function md2json(markdownContent) {
    const lines = markdownContent.split('\n')
    const stack = []
    const rootLevel = []
    const blockIDs = []
    const blockIDsInBlockText = {}
    let lastBlock = null
    let blockIndex = 0

    lines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed) {
            // ignore empty lines
            return
        }

        /// TODO add support for multiple line Block text i.e. multiline list text in Markdown

        const indent = extractBlockIndention(line)
        const blockText = trimmed.replace(/^- /, '')
        const newBlock = {
            ...blockUtilities.createNewBlock(),
            content: blockText,
            indent,
            writeIDToFile: false,
        }

        // Block IDs sit beneath the line of text with the indention going towards the start of
        //     text (not the `-` list character). The syntax is `<indention>id:: <uuid>`, but
        //     we do not enforce any requirement for `<indention>` *yet*
        if (blockText.startsWith('id:: ') && lastBlock) {
            lastBlock.id = extractIdFromText(blockText)
            lastBlock.writeIDToFile = true
            blockIDs.push(lastBlock.id)
            return
        }

        // Grab all the other Blocks we reference in text.
        // Syntax is `((<Block ID>))` and can appear multiple times anywhere in the string.
        // Note that Block IDs are UUID4, so we specifically check for that in the Regex pattern
        const referencesInBlock = extractBlockReferences(blockText)
        referencesInBlock.forEach(ref => {
            if (!(ref in blockIDsInBlockText)) {
                blockIDsInBlockText[ref] = []
            }
            blockIDsInBlockText[ref].push({blockIndex})
        })

        while (stack.length && indent <= stack[stack.length - 1].indent) {
            stack.pop()
        }

        if (stack.length === 0) {
            rootLevel.push(newBlock)
            stack.push(newBlock)
        }
        else {
            stack[stack.length - 1].children.push(newBlock)
            stack.push(newBlock)
        }

        lastBlock = newBlock
        blockIndex++
    });

    // Empty file
    if (rootLevel.length === 0) {
        rootLevel.push(blockUtilities.createNewBlock())
    }
    
    return {rootLevel, blockIDs, blockIDsInBlockText}
}

export const json2md = (blocks, level) => {
    level || (level = 0)
    const indention = ' '.repeat(level)
    let content = ''
    blocks.forEach(block => {
        content += indention + '- ' + block.content + '\n'
        if (block.writeIDToFile) {
            content += indention + '  id:: ' + block.id + '\n'
        }
        content += json2md(block.children, level + 4)
    })
    return content
}
