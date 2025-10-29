import { json2md, md2json } from "./MarkdownJSONUtils.js"

export const pageUtils = {
    createDocUpdateRequest: (pageName, rootLevelBlocks) => {
        return {
            name: pageName,
            content: json2md(rootLevelBlocks, 0)
        }
    },
    convertPageContentToBlockNodes: (content) => {
        return md2json(content)
    },
    createPageRenameRequest: (oldName, newName, referencesToUpdate) => {
        return {
            'old_name': oldName,
            'new_name': newName,
            'references_to_update': referencesToUpdate, // should be an array of Page names
        }
    },
}
