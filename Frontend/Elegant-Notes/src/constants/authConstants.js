
export const authConstants = {
    // Routes
    testRoute: '/auth/test',

    // Access token checks
    accessTokenCheckDelayMS: 10_000,
    accessAttempts: 5,
    notAuthenticatedMsgList: [
        'Not authenticated',
        'Invalid authentication credentials',
    ],
}
