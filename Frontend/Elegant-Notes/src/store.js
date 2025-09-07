import { reactive } from "vue";

import { authUtils } from "./helpers/authUtils.js";

export const store = reactive({
    history: [],
    _page: Object,
    _jwtToken: undefined,

    async init() {
        console.log('starting up global store')
        
        let token = authUtils.tryGetAuthTokenCookie()
        if (token && await authUtils.isJWTValid(token)) {
            this._jwtToken = token
        }
        else {
            authUtils.clearAuthToken()
            this._jwtToken = undefined
        }
    },
    setPage(page) {
        this._page = page
    },
    getPage() {
        return this._page
    },
    setJWTToken(token) {
        this._jwtToken = token
        authUtils.setAuthTokenCookie(token)
    },
    getJWTToken() {
        return this._jwtToken
    },
    isUserAuthenticated() {
        return this._jwtToken !== undefined
    },
})