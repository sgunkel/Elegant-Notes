function createRequest(dataToSend, protocol) {
    const headerData = {
        // 'Authorization': 'Bearer ' + token.access_token, // add this later
        'accept': 'application/json',
        'Content-Type': 'application/json',
    }
    const request = {
        method: protocol,
        // withCredentials: true,
        // credentials: 'include',
        headers: headerData,
    }
    if (protocol !== 'GET') {
        request.body = JSON.stringify(dataToSend)
    }
    return request
}

export const fetchWithToken = async (url, dataToSend, protocol) => {
    let result
    const request = createRequest(dataToSend, protocol)
    await fetch(url, request)
        .then(response => {
            if (response.status >= 200 && response.status < 300) {
                return response.json()
            }
            return {msg: response.text()}
        })
        .then(data => result = data)
        .catch(errorStr => result = errorStr)
    return result
}

