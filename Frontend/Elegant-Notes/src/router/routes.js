import { createRouter, createWebHistory } from "vue-router"

import PageView from "@/components/PageView.vue"
import PageEditor from "@/components/Editors/PageEditor.vue"
import NewPageDialog from "@/components/NewPageDialog.vue"

const routes = [
    {
        path: '/pages',
        name: 'Pages',
        component: PageView
    },
    {
        path: '/page-editor',
        name: 'PageEditor',
        component: PageEditor
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
