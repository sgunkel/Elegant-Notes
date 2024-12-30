/*
 * Constants used throughout the application to make everything more
 *   maintainable and readable.
 */

const ADDRESS = 'http://127.0.0.1:8000' // TODO Figure out where we can send stuff to better

const PAGE_PREFIX = `${ADDRESS}/page`
const BLOCK_PREFIX = `${ADDRESS}/block`

export const constants = {
    URLs: {
        // Note: all routes should *not* end with a slash
        ADD_PAGE: `${PAGE_PREFIX}/add`,
        PAGE_BY_ID: PAGE_PREFIX,
        ALL_PAGES: `${PAGE_PREFIX}/all`,
        UPDATE_PAGE: `${PAGE_PREFIX}/update`,

        ADD_BLOCK: `${BLOCK_PREFIX}/add`,
        BLOCK_BY_ID: BLOCK_PREFIX,
        UPDATE_BLOCK: `${BLOCK_PREFIX}/update`,
    },
    PAGES: {
        HOME: '/',
        PAGE: '/page',
        NEW_PAGE: '/new-page'
    }
}
