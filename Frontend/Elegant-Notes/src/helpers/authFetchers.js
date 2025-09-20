import { authUtils } from './authUtils.js'
import { authRoutes } from '@/constants/routeConstants.js'

export const authFetcher = {
    checkAccessToken: (token, successFn, failureFn) => {
        authUtils.getWithAuth(authRoutes.authTest, token)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    },
    refreshToken: (token, successFn, failureFn) => {
        authUtils.getWithAuth(authRoutes.refresh, token)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(err => failureFn(err))
    }
}
