import { v4 as uuidv4 } from 'uuid'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()
// TODO add rules for changing Block references to links that go to that reference
export default md

export function md2json(markdownContent) {
    const lines = markdownContent.split('\n')
    const stack = []
    const rootLevel = []
    const blockIDs = []
    let lastBlock = null

    lines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed) {
            // ignore empty lines
            return
        }

        const indent = line.match(/^\s*/)[0].length
        const blockText = trimmed.replace(/^- /, '')
        const newBlock = {
            id: uuidv4(), // TODO add support for reading IDs in Logseq format
            content: blockText,
            children: [],
            indent,
            writeIDToFile: false,
        }

        // Block IDs sit beneath the line of text with the indention going towards the start of
        //     text (not the `-` list character). The syntax is `<indention>id:: <uuid>`, but
        //     we do not enforce any requirement for `<indention>` *yet*
        if (blockText.startsWith('id:: ') && lastBlock) {
            lastBlock.id = blockText.replace(/^id:: /, '').trim()
            lastBlock.writeIDToFile = true
            blockIDs.push(lastBlock.id)
            return
        }

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
    });

    // Empty file
    if (rootLevel.length === 0) {
        rootLevel.push({
            id: uuidv4(),
            content: '',
            children: [],
            indent: 0,
        })
    }
    return {rootLevel, blockIDs}
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
