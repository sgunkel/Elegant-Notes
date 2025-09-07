import { authRoutes } from "@/constants/routeConstants.js"
import { authStorage } from "@/constants/localStorageConstants.js"

import { store } from '@/store.js'

export const authUtils = {
    tryGetAuthTokenCookie: () => {
        let result
        try {
            const token = localStorage.getItem(authStorage.jwt)
            result = JSON.parse(token)
        }
        catch {}
        return result || undefined // JSON.parse returns `null`, but we check for `undefined` everywhere
    },
    setAuthTokenCookie: (token) => {
        localStorage.setItem(authStorage.jwt, JSON.stringify(token))
    },
    clearAuthToken: () => {
        localStorage.removeItem(authStorage.jwt)
    },
    fetchWithAuth: (protocol, url, dataToSend, jwtToken) => {
        const headerData = {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        }
        const jwt = jwtToken || store.getJWTToken()
        if (jwt && jwt.token_type && jwt.access_token) {
            headerData.Authorization = `${jwt.token_type} ${jwt.access_token}`
        }
        const request = {
            headers: headerData,
            method: protocol,
        }
        if (dataToSend) {
            request.body = JSON.stringify(dataToSend)
        }
        return fetch(url, request)
    },
    getWithAuth: (url, token) => authUtils.fetchWithAuth('GET', url, undefined, token),
    postWithAuth: (url, data, token) => authUtils.fetchWithAuth('POST', url, data, token),
    isJWTValid: async (token) => {
        let result = false
        try {
            const response = await authUtils.getWithAuth(authRoutes.authTest, token)
            const info = await response.json()
            if (info.detail) {
                result = info.detail === 'User is valid'
            }
        } catch (e) { }
        return result
    },
    sendRegistrationForm: (name, username, password, successFn, failureFn) => {
        const headerData = {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        }
        const bodyData = {
            name,
            username,
            password,
        }
        const payload = {
            method: 'POST',
            headers: headerData,
            body: JSON.stringify(bodyData),
        }
        fetch(authRoutes.registerUserRoute, payload)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(error => failureFn(error))
    }
}
