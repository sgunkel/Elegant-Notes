import { createRouter, createWebHistory } from "vue-router"

import HomePage from "./components/home/HomePage.vue"

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
