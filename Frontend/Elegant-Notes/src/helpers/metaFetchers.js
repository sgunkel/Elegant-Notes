import { metaRoutes } from '@/constants/routeConstants.js'
import { authUtils } from './authUtils.js'

export const metaOperations = {
    getBacklinks: (pageName, successFn, failureFn) => {
        authUtils.getWithAuth(`${metaRoutes.getBacklinks}/${pageName}`)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    }
}
