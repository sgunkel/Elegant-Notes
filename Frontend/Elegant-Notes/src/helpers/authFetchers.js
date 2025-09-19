import { authUtils } from './authUtils.js'
import { authConstants } from '@/constants/authConstants.js'

export const authFetcher = {
    checkAccessToken: (token, successFn, failureFn) => {
        authUtils.getWithAuth(authConstants.testRoute, token)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
}
