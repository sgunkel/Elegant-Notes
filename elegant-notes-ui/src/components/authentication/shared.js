/*
 * Collection of shared functions between creating user accounts and logging in.
 */

/**
 * Create an appropriate form request to send to the backend. This is shared on Account Creation 
 *   forms as well as login forms, with the slight difference being if full_name is passed.
 * @typedef {object} FormRequest
 * @param {string} username 
 * @param {string} password 
 * @param {string|undefined} full_name 
 * @returns {FormRequest}
 */
export const createFormRequest = (username, password, full_name) => {
    const formData = new FormData()
    formData.append('username', username)
    formData.append('password', password)
    if (full_name) {
        formData.append('full_name', full_name)
    }
    return {
        body: formData,
        method: 'POST'
    }
}

/**
 *
 * @param {string} username 
 * @param {string} password 
 * @param {function(string): void} successCallback
 * @param {function(string): void} unsuccessCallback 
 * @param {function(string): void} errorCallback 
 */
export const handleLogin = async (username, password, successCallback, unsuccessCallback, errorCallback) => {
    const request = createFormRequest(username, password)
    await fetch('/user/token', request)
    .then(response => response.json())
    .then(data => {
        if (data.detail) {
            unsuccessCallback(data.detail)
        }
        else {
            successCallback(data)
        }
    })
    .catch(error => errorCallback(error))
}
