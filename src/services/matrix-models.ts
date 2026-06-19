/** HTTP methods used by the small Matrix REST adapter. */
export type MatrixHttpMethod = "GET" | "POST" | "PUT";

export interface MatrixSession {
    /** Bearer token returned by Matrix login and sent in Authorization headers. */
    accessToken: string;

    /** Matrix device id assigned during login. */
    deviceId?: string;

    /** Matrix user id for the logged-in account, for example "@alex92:localhost". */
    userId: string;
}

export interface MatrixLoginResponse {
    /** Raw Matrix access token returned by /login. */
    access_token: string;

    /** Matrix device id returned by /login. */
    device_id?: string;

    /** Homeserver name returned by /login, for example "localhost". */
    home_server?: string;

    /** Matrix user id returned by /login. */
    user_id: string;

    /** Optional discovery data returned by some homeservers. */
    well_known?: {
        /** Client homeserver discovery entry. */
        "m.homeserver"?: {
            /** Base URL clients should use for this homeserver. */
            base_url?: string;
        };
    };
}

export interface MatrixProfileResponse {
    /** Matrix avatar MXC URI from /profile/{userId}. */
    avatar_url?: string;

    /** Matrix profile display name from /profile/{userId}. */
    displayname?: string;
}

export interface MatrixJoinedRoomsResponse {
    /** Room ids the authenticated user has joined. */
    joined_rooms: string[];
}

export interface MatrixUserDirectoryResponse {
    /** User directory search matches. */
    results: {
        /** Matrix avatar MXC URI for the matched user. */
        avatar_url?: string | null;

        /** Display name for the matched user. */
        display_name?: string;

        /** Matrix user id for the matched user. */
        user_id: string;
    }[];
}

export interface MatrixEvent<TContent = Record<string, unknown>> {
    /** Event age in milliseconds. Some endpoints put this under unsigned.age instead. */
    age?: number;

    /** Event content. Shape depends on event type. */
    content?: TContent;

    /** Server-generated Matrix event id. */
    event_id?: string;

    /** Server timestamp in milliseconds since Unix epoch. */
    origin_server_ts?: number;

    /** Room id that owns this event. */
    room_id?: string;

    /** Matrix user id of the event sender. */
    sender?: string;

    /** State key for state events, such as user id on m.room.member. */
    state_key?: string;

    /** Matrix event type, for example "m.room.message" or "m.room.member". */
    type: string;

    /** Older Matrix field alias for sender on some responses. */
    user_id?: string;

    /** Non-authoritative metadata added by the server for this requesting client. */
    unsigned?: {
        /** Event age in milliseconds when supplied in unsigned metadata. */
        age?: number;

        /** Membership metadata sometimes included for timeline/state events. */
        membership?: string;

        /** Client transaction id, usually visible to the client that sent the event. */
        transaction_id?: string;
    };
}

export interface MatrixMessagesResponse {
    /** Timeline chunk returned by /rooms/{roomId}/messages. */
    chunk: MatrixEvent<MatrixMessageContent>[];
}

export interface MatrixMessageContent {
    /** Human-readable message body for m.room.message events. */
    body?: string;

    /** Matrix message subtype, for example "m.text". */
    msgtype?: string;
}

export interface MatrixMemberContent {
    /** Member avatar MXC URI in m.room.member state. */
    avatar_url?: string;

    /** Member display name in m.room.member state. */
    displayname?: string;

    /** Membership value, for example "join", "invite", "leave", or "ban". */
    membership?: string;
}

export interface MatrixRoomNameContent {
    /** Room name from m.room.name state. */
    name?: string;
}

export interface MatrixRoomAvatarContent {
    /** Room avatar MXC URI from m.room.avatar state. */
    url?: string;
}

export interface MatrixRoomCanonicalAliasContent {
    /** Canonical room alias from m.room.canonical_alias state. */
    alias?: string;
}

export interface MatrixRoomCreateContent {
    /** Matrix user id of the room creator. */
    creator?: string;

    /** Matrix room version selected when the room was created. */
    room_version?: string;
}

export interface MatrixRoomEncryptionContent {
    /** Matrix encryption algorithm, for example "m.megolm.v1.aes-sha2". */
    algorithm?: string;
}

export interface MatrixRoomTopicContent {
    /** Room topic from m.room.topic state. */
    topic?: string;
}
