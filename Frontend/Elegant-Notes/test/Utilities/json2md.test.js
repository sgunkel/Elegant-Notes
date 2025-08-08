import { json2md } from "@/helpers/json2MdConverter";
import { describe, it, expect } from 'vitest'

const emptyRootLevel = []
const expectedEmptyRootLevel = ''

const expectedSimpleRootLevel = '- a\n- b\n- c\n'
const simpleRootLevel = [
    { content: 'a', children: [] },
    { content: 'b', children: [] },
    { content: 'c', children: [] },
]

const expectedSimpleNestedRootLevel = '- a\n    - b\n'
const simpleNestedRootLevel = [
    { content: 'a', children: [
            { content: 'b', children: [] }
    ] }
]

const expectedComplexRootLevel = '- a\n- b\n    - c\n    - d\n        - e\n    - f\n- g\n    - h\n        - i\n'
const complexNestedRootLevel = [
    { content: 'a', children: [] },
    { content: 'b', children: [
        { content: 'c', children: [] },
        { content: 'd', children: [
            { content: 'e', children: [] },
        ] },
        { content: 'f', children: [] },
    ] },
    { content: 'g', children: [
        { content: 'h', children: [
            { content: 'i', children: [] }
        ] },
    ] },
]

describe.each([
    ['No content', expectedEmptyRootLevel, emptyRootLevel],
    ['Simple list', expectedSimpleRootLevel, simpleRootLevel],
    ['Simple nested list', expectedSimpleNestedRootLevel, simpleNestedRootLevel],
    ['Complex nested list', expectedComplexRootLevel, complexNestedRootLevel],
])('JSON->MD converter helper function', (testTitle, expectedMarkdown, givenJSON) => {
    const actualMd = json2md(givenJSON)
    it(testTitle, () => expect(actualMd, testTitle).toBe(expectedMarkdown))
})
