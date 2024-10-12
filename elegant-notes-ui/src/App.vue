<script>

const SERVER_URL = 'http://127.0.0.1:8000'
const ALL_NOTES_URL = `${SERVER_URL}/all-notes`

export default {
  data() {
    return {
      response: {},
    }
  },
  methods: {
    fetchResponse(url) {
      // https://www.koderhq.com/tutorial/vue/http-fetch/
      fetch(url)
      .then(fetched => fetched.json())
      .then(data => this.response = JSON.stringify(data, null))
      .catch(reason => this.response = reason)
    },
    getAllNotes() {
      this.fetchResponse(ALL_NOTES_URL)
    }
  }
}
</script>

<template>
  <div class="app-background">
    <div class="app-controls">
      <div class="app-controls-row">
        <div class="app-control-btn" @click="getAllNotes">Get all notes</div>
      </div>
    </div>
    <div class="response">
      {{ response }}
    </div>
  </div>
</template>

<style scoped>

.app-background {
  width: 100%;
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.app-controls {
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
}

.app-controls-row {
  display: flex;
  flex-direction: row;
}

.app-control-btn {
  background-color: rebeccapurple;
  width: 100%;
  height: 100%;
  text-align: center;
}

.response {
  padding: 0;
  margin: 0;
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>
