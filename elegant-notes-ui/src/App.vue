<script>

const SERVER_URL = 'http://127.0.0.1:8000' // this will change later...
const ALL_NOTES_URL_ROUTE = `${SERVER_URL}/all-notes`
const NOTE_BY_ID_ROUTE = `${SERVER_URL}/notes/`
const ADD_NOTE_ROUTE = `${SERVER_URL}/add-note?`
const DELETE_NOTE_ROUTE = `${SERVER_URL}/delete-note/`
const UPDATE_NOTE_ROUTE = `${SERVER_URL}/update-note/`
const GET_ALL_BRANCHES_ROUTE = `${SERVER_URL}/branches`
const GET_CURRENT_BRANCH_ROUTE = `${SERVER_URL}/current-branch`
const CREATE_BRANCH_ROUTE = `${SERVER_URL}/create-branch/`
const CHANGE_BRANCH_ROUTE = `${SERVER_URL}/change-branch/`
const DELETE_BRANCH_ROUTE = `${SERVER_URL}/delete-branch/`
const GET_DIFF_ON_BRANCH_ROUTE = `${SERVER_URL}/diff/`
const APPLY_CHANGES_TO_BRANCH_ROUTE = `${SERVER_URL}/apply-branch/`

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
      },
      branchMeta: {
        newBranchName: '',
        branchToChangeTo: '',
        branchToDelete: '',
        branchToGetDiffOn: '',
        branchToApplyChangesOn: '',
      },
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
      .then(data => this.response = JSON.stringify(data, null, 2))
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
      // with the way we use a Pydantic BaseModel in the route in Python, we send
      //   out data in the body with header information on the payload
      // this is what we'll probably do for all communication
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
    getAllBranches() {
      this.fetchResponse(GET_ALL_BRANCHES_ROUTE)
    },
    getCurrentBranch() {
      this.fetchResponse(GET_CURRENT_BRANCH_ROUTE)
    },
    createBranch() {
      const route = `${CREATE_BRANCH_ROUTE}${this.branchMeta.newBranchName}`
      this.fetchResponse(route, 'PUT')
    },
    changeBranch() {
      const route = `${CHANGE_BRANCH_ROUTE}${this.branchMeta.branchToChangeTo}`
      this.fetchResponse(route, 'PUT')
    },
    deleteBranch() {
      const route = `${DELETE_BRANCH_ROUTE}${this.branchMeta.branchToDelete}`
      this.fetchResponse(route, 'DELETE')
    },
    getDiffOnBranch() {
      const route = `${GET_DIFF_ON_BRANCH_ROUTE}${this.branchMeta.branchToGetDiffOn}`
      this.fetchResponse(route)
    },
    applyChangesToBranch() {
      const route = `${APPLY_CHANGES_TO_BRANCH_ROUTE}${this.branchMeta.branchToApplyChangesOn}`
      this.fetchResponse(route, 'PUT')
    },
  }
}
</script>

<template>
  <div class="app-background">
    <div class="app-controls">
      <h3>Note controls</h3>
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

      <h3>Version control</h3>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="getAllBranches">Get all branches</div>
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="getCurrentBranch">Get current branch</div>
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="createBranch">Create branch</div>
        <input v-model="branchMeta.newBranchName" placeholder="Branch name">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="changeBranch">Change branch</div>
        <input v-model="branchMeta.branchToChangeTo" placeholder="Branch name">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="deleteBranch">Delete branch</div>
        <input v-model="branchMeta.branchToDelete" placeholder="Branch name">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="getDiffOnBranch">Get diff on branch</div>
        <input v-model="branchMeta.branchToGetDiffOn" placeholder="Branch name">
      </div>
      <div class="app-controls-row">
        <div class="app-control-btn" @click="applyChangesToBranch">Apply changes to branch</div>
        <input v-model="branchMeta.branchToApplyChangesOn" placeholder="Branch name">
      </div>
    </div> <!-- app-controls -->
    <code class="response">
      {{ response }}
    </code>
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
  padding: 0 0.25em;
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
  background-color: #b0afaf;
  padding: 0 0.25em;
  margin: 0;
  height: 100%;
  width: 100%;
  overflow: auto;
  white-space: pre-wrap;
}
</style>
