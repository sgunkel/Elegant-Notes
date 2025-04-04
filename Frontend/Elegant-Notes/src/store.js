import { reactive } from "vue";

export const store = reactive({
    history: [],
    _page: Object,

    init() {
        console.log('starting up global store')
    },
    setPage(page) {
        this._page = page
    },
    getPage() {
        return this._page
    },
})