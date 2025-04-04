import './assets/main.css'

import { createApp } from 'vue'
import { router } from './routes.js'
import App from './App.vue'
import { store } from './store.js'

const sendCmd = (args) => store.history.unshift(`${new Date().toLocaleString()} >> ${args}`)
const receiveCmd = (args) => store.history.unshift(`${new Date().toLocaleString()} << ${args}`)

const oldFetch = window.fetch
window.fetch = async (input, options) => {
    sendCmd(input)
    let response = await oldFetch(input, options)
    
    // modify the response
    let content = await response.text()
    receiveCmd(content)
    return new Response(content, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
    })
}

createApp(App)
    .use(router)
    .mount('#app')
