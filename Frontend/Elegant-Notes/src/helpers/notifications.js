/**
 * notifications.js
 * 
 * Abstracted way to show information to users in the form of notifications. This uses
 *     libraries to handle everything, and we abstract it here to only change this file
 *     when moving libraries.
 */

import { push } from 'notivue'

export const notificationUtils = {

    //
    // Toast notifications are displayed in the top right corner
    //
    toastSuccess: (msg) => {
        push.success(msg)
    },
    toastError: (msg) => {
        push.error(msg)
    },
    toastWarning: (msg) => {
        push.warning(msg)
    },
    toastInfo: (msg) => {
        push.info(msg)
    },
}
