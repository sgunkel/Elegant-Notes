import { createRouter, createWebHistory } from "vue-router"

import PageView from "@/components/Pages/AllPagesPage.vue"
import PageEditor from "@/components/Editors/PageEditor.vue"
import NewPageDialog from "@/components/Dialogs/NewPageDialog.vue"

import { routerConstants } from "@/constants/routerConstants.js"

const routes = [
    {
        path: routerConstants.allPagesRoute,
        name: routerConstants.allPagesName,
        component: PageView
    },
    {
        path: routerConstants.pageEditorRoute,
        name: routerConstants.pageEditorName,
        component: PageEditor
    },
    {
        path: routerConstants.newPageRoute,
        name: routerConstants.newPageName,
        component: NewPageDialog
    },

    {
        path: routerConstants.rootPath,
        redirect: routerConstants.allPagesRoute
    },
]

export const router = createRouter({
    history: createWebHistory(),
    routes
})
