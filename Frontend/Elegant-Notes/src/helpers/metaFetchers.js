import { metaRoutes } from '@/constants/routeConstants.js'
import { authUtils } from './authUtils.js'

export const metaOperations = {
    getReferences: (pageName, blockIDs, successFn, failureFn) => {
        const data = {
            'page_name': pageName,
            'block_ids': blockIDs,
        }
        authUtils.postWithAuth(metaRoutes.references, data)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    searchPagesByName: (partialName, successFn, failureFn) => {
        const data = {
            'query': partialName,
        }
        authUtils.postWithAuth(metaRoutes.pageLookup, data)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    searchBlocksByText: (text, successFn, failureFn) => {
        const data = {
            'query': text
        }
        authUtils.postWithAuth(metaRoutes.blockLookup, data)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    assignBlockID: (blockSearchResultWithNewID, successFn, failureFn) => {
        // `blockSearchResultWithNewID` argument should match exactly what was
        //     returned from `searchBlocksByText()` ***with*** the new ID!!!!
        authUtils.postWithAuth(metaRoutes.blockIdAssignment, blockSearchResultWithNewID)
            .then(response => response.json())
            .then(info => successFn(info))
            .catch(err => failureFn(err))
    }
}
