import { reactive } from "vue";
import { fetchWithToken } from "./util.js";

const TOKEN_KEY = 'access_token'

function tryGetAccessToken() {
    try {
        const tokenData = localStorage.getItem(TOKEN_KEY)
        return JSON.parse(tokenData)
    }
    catch {
        return undefined
    }
}

export const store = reactive({
    token: undefined,
    init() {
        const tokenData = tryGetAccessToken()
        if (tokenData) {
            this.token = tokenData
        }
    },

    // Authentication
    setAccessToken(tokenData) {
        this.token = tokenData
        if (tokenData) {
            localStorage.setItem(TOKEN_KEY, JSON.stringify(tokenData))
        }
        else {
            localStorage.removeItem(TOKEN_KEY)
        }
    },
    isAuthenticated() {
        return this.token !== undefined
    },
    async fetchFromServer(url, data, protocol) {
        return await fetchWithToken(url, data, protocol, this.token)
    },
})
