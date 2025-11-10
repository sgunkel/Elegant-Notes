/**
 * notifications.js
 * 
 * Abstracted way to show information to users in the form of notifications. This uses
 *     libraries to handle everything, and we abstract it here to only change this file
 *     when moving libraries.
 */

import { v4 as uuidv4 } from 'uuid'
import { push } from 'notivue'

// We'll keep this outside of the exported stuff. Complex enough to move to it's own object
//     for the time being. Also, we're trying to keep notificationUtils stateless (hence all
//     the arrow functions) and this groups together nicer.
const progressToastUtils = {
    _progressToastsNotifications: {},
    createProgressToast(initialMsg) {
        const id = uuidv4()
        const notification = push.promise(initialMsg)
        this._progressToastsNotifications[id] = notification
        return id
    },
    tryProgressToastUpdate(toastID, updateToastFn) {
        var success = false
        if (toastID in this._progressToastsNotifications) {
            const notification = this._progressToastsNotifications[toastID]
            updateToastFn(notification)
            delete this._progressToastsNotifications[toastID] // might not be the best way of doing this...
            success = true
        }
        return success
    },
}

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
    // Progress Toasts
    startProgressToast: (loadingMsg) => progressToastUtils.createProgressToast(loadingMsg),
    tryResolveProgressToast: (toastID, resolvedMsg) => {
        return progressToastUtils.tryProgressToastUpdate(toastID, (notification) => notification.resolve(resolvedMsg))
    },
    tryRejectProgressToast: (toastID, rejectionMsg) => {
        return progressToastUtils.tryProgressToastUpdate(toastID,
            (notification) => notification.reject({message: rejectionMsg, duration: 0}))
    },
}
