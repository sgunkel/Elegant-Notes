<script>

const SERVER_URL = 'http://127.0.0.1:8000' // this will change later...
const ALL_NOTES_URL_ROUTE = `${SERVER_URL}/all-notes`
const NOTE_BY_ID_ROUTE = `${SERVER_URL}/notes/`
const ADD_NOTE_ROUTE = `${SERVER_URL}/add-note?`
const DELETE_NOTE_ROUTE = `${SERVER_URL}/delete-note/`
const UPDATE_NOTE_ROUTE = `${SERVER_URL}/update-note/`

export default {
  data() {
    return {
      response: {},
      noteMeta: {
        idToFetch: '',
        newNote: {
          authorName: '',
          text: '',
        },
        noteIdToDelete: '',
        noteToUpdate: {
          id: '',
          author: '',
          text: '',
        },
      }
    }
  },
  methods: {
    fetchResponse(url, fetch_method, header_obj, body_obj) {
      // https://www.koderhq.com/tutorial/vue/http-fetch/
      fetch(url, {
        method: fetch_method || 'GET',
        headers: header_obj || undefined,
        body: (body_obj) ? JSON.stringify(body_obj) : undefined
      })
      .then(fetched => fetched.json())
      .then(data => this.response = JSON.stringify(data))
      .catch(reason => this.response = reason)
    },
    getAllNotes() {
      this.fetchResponse(ALL_NOTES_URL_ROUTE)
    },
    getNoteByID() {
      const route = NOTE_BY_ID_ROUTE + this.noteMeta.idToFetch
      this.fetchResponse(route)
    },
    createNote() {
      const query = new URLSearchParams({
        author: this.noteMeta.newNote.authorName,
        text: this.noteMeta.newNote.text,
      })
      const route = ADD_NOTE_ROUTE + query.toString()
      this.fetchResponse(route, 'POST')
    },
    deleteNote() {
      const route = DELETE_NOTE_ROUTE + this.noteMeta.noteIdToDelete
      this.fetchResponse(route, 'DELETE')
    },
    updateNote() {
      const objectToUpdate = {
        ID: this.noteMeta.noteToUpdate.id,
        text: this.noteMeta.noteToUpdate.text,
        author: this.noteMeta.noteToUpdate.author
      }
      const header_obj = {
        'Content-Type': 'application/json'
      }
      this.fetchResponse(UPDATE_NOTE_ROUTE, 'PUT', header_obj, objectToUpdate)
    },
  }
}
</script>

<template>
  <div class="app-background">
    <div class="app-controls">
      <div class="app-controls-row">
        <div class="app-control-btn" @click="getAllNotes">Get all notes</div>
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="getNoteByID">Get note by ID</div>
        <input v-model="noteMeta.idToFetch" placeholder="Note ID">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="createNote">Add note</div>
        <input v-model="noteMeta.newNote.authorName" placeholder="Author name">
        <input v-model="noteMeta.newNote.text" placeholder="Note text">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="deleteNote">Delete note</div>
        <input v-model="noteMeta.noteIdToDelete" placeholder="Note ID">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="updateNote">Update note</div>
        <input v-model="noteMeta.noteToUpdate.id" placeholder="Note ID">
        <input v-model="noteMeta.noteToUpdate.author" placeholder="Author name">
        <input v-model="noteMeta.noteToUpdate.text" placeholder="Note text">
      </div>
    </div> <!-- app-controls -->
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
  margin-top: 0.15em;
}

.app-control-btn {
  border: 0.15em solid black;
  border-radius: 0.25em;
  width: 100%;
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
