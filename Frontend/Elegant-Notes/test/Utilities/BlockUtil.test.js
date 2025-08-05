import { describe, it, expect } from 'vitest'
import { removeIDsFromBlockObjects } from '../blockObjUtils.js'
import { md2json } from '@/helpers/md2json.js'

///
/// Mock Markdown content to be parsed
///
const emptyContent = ''
const basicListWithNewline = '- a\n- b\n- c\n'
const basicListWithoutNewline = '- a\n- b\n- c'
const basicListPrependedNewline = '\n- a\n- b\n- c'
const nestedSingleParent = '- a\n    - b'
const nestedSingleParentWithMultipleNewlines = '\n- a\n\n    - b\n'
const multipleNestedParents = '- a\n    - b\n- c\n    - d\n- e\n    - f\n    - g\n- h\n    - i'
const singleWithGrandchildren = '- a\n    - b\n        - c'
const multipleGrandparents = '- a\n    - b\n        - c\n    - d\n    - e\n- f\n- g\n    - h\n    - i\n        - j'

///
/// Expected object structures from Markdown Parser with our add-ons
///
const expectedEmptyContentList = [
    // For PageContent.vue's sake, we always pass it at least one Block object, so when the Markdown
    //     file is empty, we return an empty Block object
    { content: '', indent: 0, children: [] }
]
const expectedBasicList = [
    { content: 'a', indent: 0, children: [] },
    { content: 'b', indent: 0, children: [] },
    { content: 'c', indent: 0, children: [] },
]
const expectedNestedSingleParent = [
    { content: 'a', indent: 0, children: [
        { content: 'b', indent: 4, children: [] },
    ] },
]
const expectedMultipleNestedParents = [
    { content: 'a', indent: 0, children: [
        { content: 'b', indent: 4, children: [] },
    ] },
    { content: 'c', indent: 0, children: [
        { content: 'd', indent: 4, children: [] },
    ] },
    { content: 'e', indent: 0, children: [
        { content: 'f', indent: 4, children: [] },
        { content: 'g', indent: 4, children: [] },
    ] },
    { content: 'h', indent: 0, children: [
        { content: 'i', indent: 4, children: [] },
    ] },
]
const expectedSingleWithGrandchildren = [
    { content: 'a', indent: 0, children: [
        { content: 'b', indent: 4, children: [
            { content: 'c', indent: 8, children: [] }
        ] },
    ] },
]
const expectedMultipleGrandparents = [
    { content: 'a', indent: 0, children: [
        { content: 'b', indent: 4, children: [
            { content: 'c', indent: 8, children: [] }
        ] },
        { content: 'd', indent: 4, children: [] },
        { content: 'e', indent: 4, children: [] },
    ] },
    { content: 'f', indent: 0, children: [] },
    { content: 'g', indent: 0, children: [
        { content: 'h', indent: 4, children: [] },
        { content: 'i', indent: 4, children: [
            { content: 'j', indent: 8, children: [] }
        ] },
    ] },
]

// TODO add back-link tests once implemented in add-ons
// TODO add Object-ID-in-file tests once references are implemented

describe.each([
    ['No content', expectedEmptyContentList, emptyContent],
    ['Basic list ending *with* newline', expectedBasicList, basicListWithNewline],
    ['Basic list ending *without* newline', expectedBasicList, basicListWithoutNewline],
    ['Basic list *starting with* newline', expectedBasicList, basicListPrependedNewline],
    ['Nested with single parent', expectedNestedSingleParent, nestedSingleParent],
    ['Nested with single parent with newlines between Objects', expectedNestedSingleParent, nestedSingleParentWithMultipleNewlines],
    ['Multiple parents with children', expectedMultipleNestedParents, multipleNestedParents],
    ['Single grandparent with one child and one grandchild', expectedSingleWithGrandchildren, singleWithGrandchildren],
    ['Multiple grandparents', expectedMultipleGrandparents, multipleGrandparents],
])('Parsed Markdown Object Structure', (testTitle, expectedResult, mdFileContent) => {
    const parsedMd = md2json(mdFileContent)
    const actualListWithoutIDs = removeIDsFromBlockObjects(parsedMd)
    it(testTitle, () => expect(actualListWithoutIDs, testTitle).toEqual(expectedResult))
})
