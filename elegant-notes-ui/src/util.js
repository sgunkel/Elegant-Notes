/* 
 * Set of utility functions for interacting with the backend.
*/

/**
 * 
 * @param {string} url The URL to send/receive data
 * @param {object} dataToSend  The data to send to the server
 * @param {object} token The access token for authentication
 * @returns {object} Response from the server
 */
export const fetchWithToken = async (url, dataToSend, token) => {
    let result
    const request = {
        body: {...dataToSend, ...token},
        method: 'POST'
    }
    await fetch(url, request)
    .then(response => {
        if (response.status >= 200 && response.status < 300) {
            return response.json()
        }
        throw new Error(response.text())
    })
    .then(data => result = data)
    .catch(errorStr => result = JSON.parse(errorStr))
    return result
}
