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
}
