
export const convertBlockObjToFormat = (obj) => {
    // must match elegant_notes_backend/models/block_model
    return {
        ID: obj['@id'],
        parent_id: obj.parent_id,
        text: obj.text,
        children: obj.children.map(child => convertBlockObjToFormat(child))
    }
}

export const convertPageObjToFormat = (obj) => {
    // must match elegant_notes_backend/models/page_model
    return {
        ID: obj['@id'],
        name: obj.name,
        children: obj.children.map(child => convertBlockObjToFormat(child)),
    }
}
