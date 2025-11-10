<script>
import { store } from './store.js';

import AuthPage from '@/components/AuthPage.vue'

import { Notivue, Notification, NotificationProgress } from 'notivue'

(async () => await store.init())()

export default {
    components: {
        AuthPage,
        Notivue,
        Notification,
        NotificationProgress,
    },
    data() {
        return {
            activity: store.history,
            store,
        }
    }
}
</script>

<template>
    <div class="app-background">
        <Notivue v-slot="item" class="nothing">
            <Notification :item="item">
                <NotificationProgress :item="item" />
            </Notification>
        </Notivue>
        <div class="app-routes-background">
            <div v-if="this.store.isUserAuthenticated()">
                <router-view></router-view>
            </div>
            <div v-else>
                <auth-page></auth-page>
            </div>
        </div>
        <div class="app-activity">
              <div
                class="app-activity-info"
                v-for="info in activity">
                {{ info }}
              </div>
        </div>
    </div>
</template>

<style>
.app-background {
    display: flex;
    flex-direction: row;
    margin: 0;
    width: 100%;
    height: 100%;
}

.app-routes-background,
.app-activity {
    flex: 1 0 0;
    height: 100%;
}

.app-routes-background {
    display: flex;
    flex-direction: column;
    /* overflow: auto; */
}

.app-activity {
    background-color: gray;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

.app-activity-info {
    border: 0.15em solid black;
    padding: 0.25em;
}
.app-activity-info > *+* {
    margin-top: 0.5em;
}
</style>
