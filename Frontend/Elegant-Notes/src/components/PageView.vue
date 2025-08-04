<script>
import { pageOperations } from '@/helpers/pageFetchers'
import PageEntry from '@/components/PageEntry.vue'
import NewPageDialog from '@/components/NewPageDialog.vue'

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
        refreshPages() {
            const pageReceivedFn = (processedPageObjects) => this.pageObjects = processedPageObjects
            const failureGettingPageFn = (errorMsg) => this.error = errorMsg
            pageOperations.getAllPages(pageReceivedFn, failureGettingPageFn)
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
