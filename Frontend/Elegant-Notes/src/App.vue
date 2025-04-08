<script>
import { store } from './store.js';

store.init()

export default {
    data() {
        return {
            activity: store.history,
        }
    }
}
</script>

<template>
    <div class="app-background">
        <div class="app-routes-background">
            <router-view></router-view>
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
