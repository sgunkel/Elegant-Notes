import { expect, test } from 'vitest'

import {parseMarkdownToBlocks} from '@/blockUtils.js'

test('Empty Markdown content', () => {
    const processedList = parseMarkdownToBlocks('')
    expect(processedList.length).toBe(1)

    const emptyChild = processedList[0]
    expect(emptyChild.children.length).toBe(0)
    expect(emptyChild.content).toBe('')
    expect(emptyChild.indent).toBe(0)
    // ID is ignored
})
