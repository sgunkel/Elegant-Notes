import { createRouter, createWebHistory } from "vue-router"

import PageView from "./components/PageView.vue"
import PageContent from "./components/PageContent.vue"
import NewPageDialog from "./components/NewPageDialog.vue"

const routes = [
    {
        path: '/pages',
        name: 'Pages',
        component: PageView
    },
    {
        path: '/page-content',
        name: 'PageContent',
        component: PageContent
    },
    {
        path: '/new-page',
        name: 'NewPage',
        component: NewPageDialog
    },

    {
        path: '/',
        redirect: '/pages'
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
