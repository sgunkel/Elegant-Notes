import {v4 as uuidv4} from 'uuid'

export function md2json(markdownContent) {
    const lines = markdownContent.split('\n')
    const stack = []
    const rootLevel = []

    lines.forEach(line => {
        const trimmed = line.trim()
        if (!trimmed) {
            // ignore empty lines
            return
        }

        const indent = line.match(/^\s*/)[0].length
        const newBlock = {
            id: uuidv4(), // TODO add support for reading IDs in Logseq format
            content: trimmed.replace(/^- /, ''),
            children: [],
            indent
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
    return rootLevel
}

export const json2md = (blocks, level) => {
    level || (level = 0)
    const indention = ' '.repeat(level)
    let content = ''
    blocks.forEach(block => {
        content += indention + '- ' + block.content + '\n'
        content += json2md(block.children, level + 4)
    })
    return content
}
