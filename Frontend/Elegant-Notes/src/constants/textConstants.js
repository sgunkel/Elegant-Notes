/**
 * Constants for text processing.
 */

export const textConstants = {

    // Syntax: `((<Block ID>))` where <Block ID> is a UUID4 string that we specifically look for
    blockRefRegex: /\(\(\w+-\w+-\w+-\w+-\w+\)\)/g,

    // Removes the pairs - turns `((<ID>))` to `<ID>`
    blockRefPairRemovalRegex: /(\(\(|\)\))/g,

    // Grabs the number of spaces from the (Markdown) list character code `-` from the beginning
    // of the line. For a child Block of a root-level Block, it would look like `    - <text>` and
    // this Regex would grab all spaces (4 in this case) from the beginning of the line.
    blockIndentionRegex: /^\s*/,

    // Syntax:
    // ```
    // - <Block text>
    //   id:: <Block ID>
    // ```
    // Note that the `id:: ` line aligns to the Block text and does not include a (Markdown) list
    // character code.
    blockIdAssignmentRemoval: /^id:: /,
}
