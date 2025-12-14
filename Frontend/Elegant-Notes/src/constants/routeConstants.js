/**
 * Constants for the backend routes - not to be confused with `routerConstants.js`
 *     which are routes for the Vue Router.
 */

export const PageRoutes = {
    getAllPages: '/page/all',
    getPage: '/page/get',
    createPage: '/page/create',
    updatePage: '/page/update',
    renamePage: '/page/rename',
}

export const metaRoutes = {
    references: '/meta/references',
}

export const authRoutes = {
    registerUserRoute: '/auth/register',
    loginUser: '/auth/login',
    logoutUser: '/auth/logout',
    userToken: '/auth/token',
    authTest: '/auth/test',
    refresh: '/auth/refresh',
}
