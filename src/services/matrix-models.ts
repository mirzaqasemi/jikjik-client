export interface MatrixSession {
    /** Bearer token returned by the Matrix SDK login call. */
    accessToken: string;

    /** Matrix device id assigned during login. */
    deviceId?: string;

    /** Matrix user id for the logged-in account, for example "@alex92:localhost". */
    userId: string;
}
