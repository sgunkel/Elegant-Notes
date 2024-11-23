/* 
 * Set of utility functions for interacting with the backend.
*/

import { store } from "./store.js"

/**
 * 
 * @param {object} dataToSend The data to send to the server in JSON format
 * @param {string} protocol The protocol to talk to the database
 * @param {object} token The access token
 * @returns {object} The final request to send in a fetch() call
 */
function createRequest(dataToSend, protocol, token) {
    const headerData = {
        'Authorization': 'Bearer ' + token.access_token,
        'accept': 'application/json',
    }
    const request = {
        method: protocol,
        withCredentials: true,
        credentials: 'include',
        headers: headerData,
    }
    if (protocol !== 'GET') {
        request.body = dataToSend
    }
    return request
}

/**
 * 
 * @param {string} url The URL to send/receive data
 * @param {object} dataToSend  The data to send to the server
 * @param {string} protocol The protocol for the request - GET, POST, PUT, DELETE
 * @param {object} token The access token for authentication
 * @returns {Promise} Response from the server
 */
export const fetchWithToken = async (url, dataToSend, protocol, token) => {
    let result
    const request = createRequest(dataToSend, protocol, token)
    await fetch(url, request)
    .then(response => {
        if (response.status >= 200 && response.status < 300) {
            return response.json()
        }
        else if (response.status == 401) { // unauthorized
            store.setAccessToken(undefined)
            return {}
        }
        throw new Error(response.text())
    })
    .then(data => result = data)
    .catch(errorStr => result = errorStr)
    return result
}
