<script>
/**
 * Page rename confirmation dialog
 */
import { v4 as uuidv4 } from 'uuid'

import PageReferenceRenameOption from '@/components/Menus/PageReferenceRenameOption.vue'

 export default {
    components: {
        PageReferenceRenameOption,
    },
    props: {
        oldPageName: String,
        newPageName: String,
        references: Array,
    },
    emits: [
        'renameConfirmed',
        'renameCancelled',
    ],
    data() {
        return {
            referenceOptions: [],
        }
    },
    mounted() {
        this.references.forEach(ref => {
            const entry = {
                id: uuidv4(),
                rename: true,
                page_name: ref.page_name
            }
            this.referenceOptions.push(entry)
        })
    },
    methods: {
        renamePage() {
            const pagesWithReferencesToUpdate = this.referenceOptions
                .filter(x => x.rename)
                .map(x => x.page_name)
            this.$emit('renameConfirmed', pagesWithReferencesToUpdate)
        },
        renameCancelled() {
            this.$emit('renameCancelled')
        },
        handleReferenceRenameOption(refID, shouldRenameFlag) {
            this.referenceOptions.forEach(ref => {
                if (ref.id === refID) {
                    ref.rename = shouldRenameFlag
                }
            })
        },
    }
 }

</script>

<template>
    <div class="prd-wrapper">
        <h2>{{ oldPageName }} -> {{ newPageName }}</h2>
        <div class="prd-confirmation-btns">
            <div class="prd-confirm-btn" @click="renamePage">Yes</div>
            <div class="prd-confirm-btn" @click="renameCancelled">No</div>
        </div>

         <div class="prd-page-rename-options">
            <!-- might just make this a component to keep everything clean -->
             <div v-for="referenceOption in referenceOptions">
                <PageReferenceRenameOption
                  :id="referenceOption.id"
                  :pageName="referenceOption.page_name"
                  :shouldRename="referenceOption.rename"
                  :key="(referenceOption.rename)"
                  @rename-reference-option-changed="handleReferenceRenameOption"
                />
            </div>
         </div>
    </div>
</template>

<style>
.prd-wrapper {
    display: flex;
    flex-direction: column;
}
.prd-confirmation-btns {
    display: flex;
    flex-direction: column;
}

.prd-confirm-btn {
    padding: 0;
}

.prd-page-rename-options {
    /* display: flex;
    flex-direction: row; */
    padding: 0;
}
</style>
