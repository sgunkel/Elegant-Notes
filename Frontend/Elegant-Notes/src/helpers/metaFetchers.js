import { metaRoutes } from '@/constants/routeConstants.js'

export const metaOperations = {
    getBacklinks: (pageName, successFn, failureFn) => {
        fetch(`${metaRoutes.getBacklinks}/${pageName}`)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    }
}
