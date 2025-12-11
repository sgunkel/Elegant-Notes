<script>
import { pageOperations } from '@/helpers/pageFetchers'
import PageEntry from '@/components/Menus/PageEntry.vue'
import NewPageDialog from '@/components/Dialogs/NewPageDialog.vue'
import { store } from '@/store'

export default {
    components: {
        PageEntry,
        NewPageDialog,
    },
    data() {
        return {
            pageObjects: [],
            error: '',
            showNewPage: false,
        }
    },
    mounted() {
        this.refreshPages()
    },
    methods: {
        logout() {
            store.setJWTToken(undefined)
        },
        refreshPages() {
            pageOperations.getAllPages(this.pageReceived, this.pageRetrievalFailed)
        },
        pageReceived(data) {
            if (data.detail) {
                this.pageRetrievalFailed(data.detail)
            }
            else {
                this.pageObjects = data
            }
        },
        pageRetrievalFailed(errorMsg) {
            this.error = errorMsg
        },
        showNewPageDialog() {
            // this.$router.push('/new-page')
            this.showNewPage = true
        },
        hideNewPageDialog() {
            this.showNewPage = false
        }
    }
}
</script>

<template>
    <div class="pv-wrapper">
        <NewPageDialog
          v-if="showNewPage"
          @cancel="hideNewPageDialog">
        </NewPageDialog>
        <div v-else>
            <div @click="logout()">Log out</div>
            <H1>{{ error }}</H1>
            <p @click="refreshPages()">Update page list</p>
            <p @click="showNewPageDialog()">New page</p>
            <div
              class="pv-list"
              v-for="page in pageObjects">
                <PageEntry
                  :page="page">
                </PageEntry>
            </div>
        </div>
    </div>
</template>

<style>
.pv-wrapper {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
}
.pv-list {
    display: flex;
    flex-direction: column;
}
</style>
