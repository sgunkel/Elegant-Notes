
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