import { fetchWithToken } from '@/utils.js'
import { PageRoutes } from "@/constants/routeConstants.js"
import { authUtils } from './authUtils.js'

export const pageOperations = {
    getAllPages: (successFn, failureFn) => {
        // TODO send JWT token and redirect to login page
        // fetch(PageRoutes.getAllPages)
        authUtils.getWithAuth(PageRoutes.getAllPages)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    getPageByName: (pageName, successFn, failureFn) => {
        // TODO send JWT token and redirect to login page
        const fullRoute = `${PageRoutes.getPage}/${pageName}`
        fetch(fullRoute)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    createPage: (data, failureFn) => {
        // TODO send JWT token and redirect to login page
        fetchWithToken(PageRoutes.createPage, data, 'POST')
            .then(err => failureFn(err))
    },
    updatePage: (data, failureFn) => {
        // TODO send JWT token and redirect to login page
        fetchWithToken(PageRoutes.updatePage, data, 'POST')
            .then(err => failureFn(err))
    },
}
