import { describe, it, expect, test } from 'vitest'
import { generateIdList, removeIDsFromBlockObjects } from '../blockObjUtils.js'
import { md2json } from '@/helpers/MarkdownJSONUtils.js'

const idList = generateIdList(64)

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

// might actually be able to reuse `makeTestCasesWithSurroundingText()` for this...
const oneBlockRefNothingElseTest = { content: `- ((${idList[0]}))`, expected: [ idList[0] ] }
const oneBlockRefPreTextTest = { content: `- something ((${idList[1]}))`, expected: [ idList[1] ] }
const oneBlockRefPostTextTest = { content: `- ((${idList[2]})) something`, expected: [ idList[2] ] }
const oneBlockRefTextAroundTest = { content: `- something ((${idList[3]})) something`, expected: [ idList[3] ] }
const twoBlockRefNoTextTest = { content: `- ((${idList[4]})) ((${idList[5]}))`, expected: [ idList[4], idList[5] ] }
const twoBlockRefTextPrependedTest = { content: `- something ((${idList[6]})) ((${idList[7]}))`, expected: [ idList[6], idList[7] ] }
const twoBlockRefTextPostTest = { content: `- ((${idList[8]})) ((${idList[9]})) something`, expected: [ idList[8], idList[9] ] }
const twoBlockRefTextAroundTest = { content: `- something ((${idList[10]})) ((${idList[11]})) something`, expected: [ idList[10], idList[11] ] }
const threeBlockRefNoTextTest = { content: `- ((${idList[12]})) ((${idList[13]})) ((${idList[14]}))`, expected: [ idList[12], idList[13], idList[14] ] }
const threeBlockRefTextPrependedTest = { content: `- something ((${idList[15]})) ((${idList[16]})) ((${idList[17]}))`, expected: [ idList[15], idList[16], idList[17] ] }
const threeBlockRefTextPostTest = { content: `- ((${idList[18]})) ((${idList[19]})) ((${idList[20]})) something`, expected: [ idList[18], idList[19], idList[20] ] }
const threeBlockRefTextAroundTest = { content: `- something ((${idList[21]})) ((${idList[22]})) ((${idList[23]})) something`, expected: [ idList[21], idList[22], idList[23] ] }
const randomPlacementBlockRefTest1 = { content: `- should look at ((${idList[24]})), which might conflict with ((${idList[25]})) and/or ((${idList[26]})).`, expected: [ idList[24], idList[25], idList[26] ] }
const randomPlacementBlockRefTest2 = { content: `- See ((${idList[27]})) for more details. Also related: ((${idList[28]})), ((${idList[29]})), ((${idList[30]})), and ((${idList[31]}))`, expected: [ idList[27], idList[28], idList[29], idList[30], idList[31] ] }
const randomPlacementBlockRefTest3 = { content: `- ((${idList[32]}))/((${idList[33]}))|((${idList[34]}))(((${idList[35]})) and ((${idList[36]})) talk about this)`, expected: [ idList[32], idList[33], idList[34], idList[35], idList[36] ] }

///
/// Expected object structures from Markdown Parser with our add-ons
///
const expectedEmptyContentList = [
    // For PageEditor.vue's sake, we always pass it at least one Block object, so when the Markdown
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

describe('md2json tests', () => {

    // TODO add back-link tests once implemented in add-ons

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
        const parsedMd = md2json(mdFileContent).rootLevel
        const actualListWithoutIDs = removeIDsFromBlockObjects(parsedMd)
        it(testTitle, () => expect(actualListWithoutIDs, testTitle).toEqual(expectedResult))
    })

    test.each([
        {title: 'One reference no text', ...oneBlockRefNothingElseTest},
        {title: 'One reference with text prepended', ...oneBlockRefPreTextTest},
        {title: 'One reference with text at the end', ...oneBlockRefPostTextTest},
        {title: 'One reference with text around it', ...oneBlockRefTextAroundTest},

        {title: 'Two references without text', ...twoBlockRefNoTextTest},
        {title: 'Two references with text prepended', ...twoBlockRefTextPrependedTest},
        {title: 'Two references with text at the end', ...twoBlockRefTextPostTest},
        {title: 'Two references with text around', ...twoBlockRefTextAroundTest},

        {title: 'Three references without text', ...threeBlockRefNoTextTest},
        {title: 'Three references with text prepended', ...threeBlockRefTextPrependedTest},
        {title: 'Three references with text at the end', ...threeBlockRefTextPostTest},
        {title: 'Three references with text around', ...threeBlockRefTextAroundTest},

        {title: 'Random placement 1', ...randomPlacementBlockRefTest1},
        {title: 'Random placement 2', ...randomPlacementBlockRefTest2},
        {title: 'Random placement 3', ...randomPlacementBlockRefTest2},
    ])
    ('Block ID References in Block user case: $title', ({content, expected}) => {
        const actual = Object.keys(md2json(content).blockIDsInBlockText)
        expect(actual).toStrictEqual(expected)
    })
})
