import { authRoutes } from "@/constants/routeConstants.js"
import { authStorage } from "@/constants/localStorageConstants.js"

import { store } from '@/store.js'

const createPayload = (bodyData, method) => {
    const headerData = {
        'accept': 'application/json',
        'Content-Type': 'application/json',
    }
    const payload = {
        method,
        headers: headerData,
        body: JSON.stringify(bodyData),
    }
    return payload
}

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
        // Calling `store.checkAccess()` here might not be a bad idea - have a rotating JWT.
        //   Unfortunately, setting up the JWT at the beginning is asynchronous and we'll
        //   run into race conditions; the noticeable problem is logging in and refreshing
        //   the page, which will take you back to the login screen. This can be fixed, or
        //   we can just have the debouncing thread in `store.checkAccess()` handle that
        //   logic and rotate the JWT whenever it's called.
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
            // should we have the logic of going to the login screen if the user is not authenticated here?
        } catch (e) { }
        return result
    },
    sendRegistrationForm: (name, username, password, successFn, failureFn) => {
        const formData = {
            id: 'should be changed on the backend',
            name,
            username,
            password,
        }
        const payload = createPayload(formData, 'POST')
        fetch(authRoutes.registerUserRoute, payload)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(error => failureFn(error))
    },
    sendLoginForm: (username, password, successFn, failureFn) => {
        const formData = {
            username,
            password,
        }
        const payload = createPayload(formData, 'POST')
        fetch(authRoutes.loginUser, payload)
            .then(response => response.json())
            .then(data => successFn(data))
            .catch(error => failureFn(error))
    },
}
