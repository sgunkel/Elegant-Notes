import './assets/main.css'

import { createApp } from 'vue'
import { router } from './router/routes.js'
import App from './App.vue'
import { store } from './store.js'

// Toast notifications
import { createNotivue } from 'notivue'
import 'notivue/notification.css'
import 'notivue/animations.css'

const toastNotifications = createNotivue({
    position: 'top-right',
    limit: 3, // TODO is this too many for mobile users?
    notifications: {
        global: {
            duration: 3000
        },
    },
})

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
    .use(toastNotifications)
    .mount('#app')
