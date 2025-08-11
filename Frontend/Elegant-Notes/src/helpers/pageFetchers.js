import { fetchWithToken } from '@/utils.js'
import { PageRoutes } from "@/constants/routeConstants"

export const pageOperations = {
    getAllPages: (successFn, failureFn) => {
        fetch(PageRoutes.getAllPages)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    getPageByName: (pageName, successFn, failureFn) => {
        const fullRoute = `${PageRoutes.getPage}/${pageName}`
        fetch(fullRoute)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    createPage: (data, failureFn) => {
        fetchWithToken(PageRoutes.createPage, data, 'POST')
            .then(err => failureFn(err))
    },
    updatePage: (data, failureFn) => {
        fetchWithToken(PageRoutes.updatePage, data, 'POST')
            .then(err => failureFn(err))
    },
}
