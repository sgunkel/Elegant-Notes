import { reactive } from "vue";

import { authUtils } from "./helpers/authUtils.js";
import { createDebounce } from "./helpers/debouncer.js";
import { authConstants } from "./constants/authConstants.js";
import { authFetcher } from "./helpers/authFetchers.js";

export const store = reactive({
    history: [],
    _page: Object,
    _jwtToken: undefined,
    _authCheckDebouncer: undefined,

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

        // Continuously checks if the user is still authenticated in the background and
        //   logs them in if not.
        this._authCheckDebouncer = createDebounce()
        this.checkAccess()
    },

    /// Page-related
    setPage(page) {
        this._page = page
    },
    getPage() {
        return this._page
    },

    // Authentication-related
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
    checkAccess(failedAttempts) {
        /**
         * Note that this repeatedly runs in the background and is thus recursive in the sense that it calls `checkAccess()`
         *   once it finishes. With how the debounce functionality works, there is no build up of the function call stack as
         *   it runs in a separate thread*, meaning that `checkAccess()` is complete after scheduling the main logic for
         *   checking the authentication status.
         */
        this._authCheckDebouncer(() => {
            const time = new Date().toLocaleString()

            const tokenIsValid = (info) => {
                /**
                 * Note that expired token responses go through here, so we check for them
                 */
                if (info.detail) {
                    if (authConstants.notAuthenticatedMsgList.includes(info.detail) && this.isUserAuthenticated()) {
                        console.log(time, 'JWT is invalid: user is signed out')
                        authUtils.clearAuthToken()
                        this.setJWTToken(undefined)
                    }
                    else if (info.detail === 'User is valid') {
                        authFetcher.refreshToken(this.getJWTToken(), (info) => this.setJWTToken(info), (error) => console.log('error when refreshing access token:', error))
                    }
                }
                this.checkAccess()
            }
            const tokenIsInvalidOrSystemIsDown = (error) => {
                let errMsg = `error when checking access: ${error}`
                failedAttempts = failedAttempts || 1
                if (String(error).startsWith('TypeError: NetworkError')) {
                    errMsg = 'Networking error: backend not responding.'
                }

                if (failedAttempts <= authConstants.accessAttempts) {
                    console.log(time, errMsg, `Attempt ${failedAttempts} out of ${authConstants.accessAttempts}`)
                    this.checkAccess(failedAttempts + 1)
                }
            }
            authFetcher.checkAccessToken(this.getJWTToken(), tokenIsValid, tokenIsInvalidOrSystemIsDown)
        }, authConstants.accessTokenCheckDelayMS)
    },
})