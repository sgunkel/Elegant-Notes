import { createRouter, createWebHistory } from "vue-router"

import { constants } from "./constants.js"
import HomePage from "./components/home/HomePage.vue"
import PageContentPage from "./components/content/PageContentPage.vue"

const routes = [
    {
        path: constants.PAGES.HOME,
        name: 'Home',
        component: HomePage
    },
    {
        path: constants.PAGES.PAGE,
        name: 'Page',
        component: PageContentPage
    },

    // TODO need a catch-all pattern to redirect to home - may require backend support
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
