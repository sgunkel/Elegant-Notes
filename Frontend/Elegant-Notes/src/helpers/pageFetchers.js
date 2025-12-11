import { PageRoutes } from "@/constants/routeConstants.js"
import { authUtils } from './authUtils.js'

export const pageOperations = {
    getAllPages: (successFn, failureFn) => {
        authUtils.getWithAuth(PageRoutes.getAllPages)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    getPageByName: (pageName, successFn, failureFn) => {
        // send JSON with page name instead of sending it via the routes
        const fullRoute = `${PageRoutes.getPage}/${pageName}`
        authUtils.getWithAuth(fullRoute)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    createPage: (data, failureFn) => {
        authUtils.postWithAuth(PageRoutes.createPage, data)
            .then(err => failureFn(err))
    },
    updatePage: (data, successFn, failureFn) => {
        authUtils.postWithAuth(PageRoutes.updatePage, data)
            .then(response => response.json)
            .then(msg => successFn(msg))
            .catch(err => failureFn(err))
    },
    renamePage: (data, successFn, failureFn) => {
        authUtils.postWithAuth(PageRoutes.renamePage, data)
            .then(response => response.json())
            .then(successObject => successFn(successObject.msg))
            .catch(error => failureFn(error))
    },
}
