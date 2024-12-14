<script>
// TODO might figure out a better name for this file without 'Page' 2x

import { store } from '@/store.js';
import { router } from '@/routes.js';
import { constants } from '@/constants.js';

export default {
    data() {
        return {
            pageName: '',
            errorMsg: '',
        }
    },
    methods: {
        sendInfo() {
            const data = {
                name: this.pageName,
                children: [],
            }
            store.fetchFromServer(constants.URLs.ADD_PAGE, data, 'POST')
              .then(response => {
                // response is an array with only 1 item - the new page's ID
                const pageID = response[0].replace('terminusdb:///data/Page/', '')
                data['@id'] = pageID
                store.setPage(data)
                router.push(constants.PAGES.PAGE)
              })
              .catch(error => this.errorMsg = error)
        },
        cancel() {
            router.back()
        }
    }
}
</script>

<template>
    <div class="npdp-wrapper">
        <h2>New Page</h2>

        <div class="npdp-error-msg-banner">
            {{ errorMsg }}
        </div>
        <h4>Page Name</h4>
        <input type="text" placeholder="Auto Maintenance, Spring Math Class, Receipts" v-model="pageName">
        <div class="npdp-dialog-btn-list">
            <div class="npdp-btn" @click="cancel">
                Go back
            </div>
            <div class="npdp-btn" @click="sendInfo">
                Create
            </div>
        </div>
    </div>
</template>

<style>
.npdp-wrapper {
    width: 50%;
    margin-left: auto;
    margin-right: auto;
}
.npdp-wrapper > h2 {
    margin-bottom: 0.5em;
}
.npdp-wrapper > h4 {
    margin: 0;
}
.npdp-wrapper > input[type=text] {
    box-sizing: border-box;
}

.npdp-error-msg-banner {
    color: red;
}

.npdp-dialog-btn-list {
    margin: 0.25em 0;
    padding: 0.15em 0.25em;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}

.npdp-btn {
    padding: 0.5em;
    border: 0.15em solid #000;
    border-radius: 0.15em;
}
</style>
