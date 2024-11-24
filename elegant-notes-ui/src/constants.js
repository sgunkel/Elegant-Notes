/*
 * Constants used throughout the application to make everything more
 *   maintainable and readable.
 */

const ADDRESS = 'http://127.0.0.1:8000' // TODO Figure out where we can send stuff to better

const PAGE_PREFIX = `${ADDRESS}/page`

export const constants = {
    URLs: {
        // Note: all routes should *not* end with a slash
        PAGE_BY_ID: `${PAGE_PREFIX}`,
        ALL_PAGES: `${PAGE_PREFIX}/all`,
    },
}
