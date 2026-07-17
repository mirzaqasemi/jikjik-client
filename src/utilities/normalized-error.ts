export const NormalizedErrorKind = {
    Unauthenticated: "unauthenticated",
    Forbidden: "forbidden",
    NotFound: "not_found",
    RateLimited: "rate_limited",
    Network: "network",
    Timeout: "timeout",
    Server: "server",
    Validation: "validation",
    UnknownError: "unknown_error",
} as const;

export type NormalizedErrorKind = typeof NormalizedErrorKind[keyof typeof NormalizedErrorKind];
export type NormalizeErrorAction = "login" | null;

export type NormalizeErrorOptions = {
    action?: NormalizeErrorAction;
};

export type NormalizedErrorDetails = {
    cause?: unknown;
    httpStatus?: number;
    matrixErrcode?: string;
    originalMessage?: string;
    retryAfterMs?: number;
};

type ErrorLike = {
    data?: unknown;
    errcode?: unknown;
    error?: unknown;
    getRetryAfterMs?: unknown;
    httpStatus?: unknown;
    message?: unknown;
    name?: unknown;
};

const MATRIX_ERRCODE_KIND: Record<string, NormalizedErrorKind> = {
    M_BAD_ALIAS: NormalizedErrorKind.Validation,
    M_BAD_JSON: NormalizedErrorKind.Validation,
    M_EXCLUSIVE: NormalizedErrorKind.Validation,
    M_FORBIDDEN: NormalizedErrorKind.Forbidden,
    M_INVALID_PARAM: NormalizedErrorKind.Validation,
    M_INVALID_USERNAME: NormalizedErrorKind.Validation,
    M_LIMIT_EXCEEDED: NormalizedErrorKind.RateLimited,
    M_MISSING_PARAM: NormalizedErrorKind.Validation,
    M_MISSING_TOKEN: NormalizedErrorKind.Unauthenticated,
    M_NOT_FOUND: NormalizedErrorKind.NotFound,
    M_NOT_JSON: NormalizedErrorKind.Validation,
    M_THREEPID_IN_USE: NormalizedErrorKind.Validation,
    M_TOO_LARGE: NormalizedErrorKind.Validation,
    M_UNKNOWN_TOKEN: NormalizedErrorKind.Unauthenticated,
    M_USER_IN_USE: NormalizedErrorKind.Validation,
};

export class NormalizedError extends Error {
    readonly kind: NormalizedErrorKind;
    readonly cause?: unknown;
    readonly httpStatus?: number;
    readonly matrixErrcode?: string;
    readonly originalMessage?: string;
    readonly retryAfterMs?: number;

    constructor(kind: NormalizedErrorKind, details: NormalizedErrorDetails = {}, options: NormalizeErrorOptions = {}) {
        super(messageForKind(kind, options.action));
        this.name = "NormalizedError";
        this.kind = kind;
        this.cause = details.cause;
        this.httpStatus = details.httpStatus;
        this.matrixErrcode = details.matrixErrcode;
        this.originalMessage = details.originalMessage;
        this.retryAfterMs = details.retryAfterMs;
    }
}

export function normalizeError(error: unknown, options: NormalizeErrorOptions = {}): NormalizedError {
    if (error instanceof NormalizedError) {
        return error;
    }

    const errorLike = asErrorLike(error);
    const matrixErrcode = stringValue(errorLike?.errcode) ?? stringValue(errorLike?.data, "errcode");
    const httpStatus = numberValue(errorLike?.httpStatus);
    const retryAfterMs = retryAfterMsValue(errorLike);
    const originalMessage = stringValue(errorLike?.error) ?? stringValue(errorLike?.message);
    const kind = normalizeErrorKind({
        action: options.action,
        httpStatus,
        matrixErrcode,
        name: stringValue(errorLike?.name),
        originalMessage,
    });

    return new NormalizedError(kind, {
        cause: error,
        httpStatus,
        matrixErrcode,
        originalMessage,
        retryAfterMs,
    }, options);
}

function normalizeErrorKind(params: {
    action?: NormalizeErrorAction;
    httpStatus?: number;
    matrixErrcode?: string;
    name?: string;
    originalMessage?: string;
}): NormalizedErrorKind {
    if (params.action === "login" && (params.matrixErrcode === "M_FORBIDDEN" || params.httpStatus === 401 || params.httpStatus === 403)) {
        return NormalizedErrorKind.Unauthenticated;
    }

    if (params.matrixErrcode != null) {
        return MATRIX_ERRCODE_KIND[params.matrixErrcode] ?? kindFromHttpStatus(params.httpStatus);
    }

    if (params.name === "ConnectionError") {
        return NormalizedErrorKind.Network;
    }

    if (params.name === "AbortError" || messageIncludes(params.originalMessage, ["timed out", "timeout"])) {
        return NormalizedErrorKind.Timeout;
    }

    if (messageIncludes(params.originalMessage, ["failed to fetch", "networkerror", "network error"])) {
        return NormalizedErrorKind.Network;
    }

    return kindFromHttpStatus(params.httpStatus);
}

function kindFromHttpStatus(httpStatus?: number): NormalizedErrorKind {
    if (httpStatus == null) {
        return NormalizedErrorKind.UnknownError;
    }

    if (httpStatus === 401) {
        return NormalizedErrorKind.Unauthenticated;
    }

    if (httpStatus === 403) {
        return NormalizedErrorKind.Forbidden;
    }

    if (httpStatus === 404) {
        return NormalizedErrorKind.NotFound;
    }

    if (httpStatus === 408) {
        return NormalizedErrorKind.Timeout;
    }

    if (httpStatus === 429) {
        return NormalizedErrorKind.RateLimited;
    }

    if (httpStatus >= 400 && httpStatus < 500) {
        return NormalizedErrorKind.Validation;
    }

    if (httpStatus >= 500) {
        return NormalizedErrorKind.Server;
    }

    return NormalizedErrorKind.UnknownError;
}

function messageForKind(kind: NormalizedErrorKind, action?: NormalizeErrorAction): string {
    if (action === "login" && kind === NormalizedErrorKind.Unauthenticated) {
        return "Username or password is wrong.";
    }

    switch (kind) {
        case NormalizedErrorKind.Unauthenticated:
            return "Please sign in again.";
        case NormalizedErrorKind.Forbidden:
            return "You do not have permission to do that.";
        case NormalizedErrorKind.NotFound:
            return "That item could not be found.";
        case NormalizedErrorKind.RateLimited:
            return "Too many requests. Try again shortly.";
        case NormalizedErrorKind.Network:
            return "Could not connect. Check your internet connection.";
        case NormalizedErrorKind.Timeout:
            return "The request timed out. Try again.";
        case NormalizedErrorKind.Server:
            return "The server had a problem. Try again later.";
        case NormalizedErrorKind.Validation:
            return "Some information is invalid. Check it and try again.";
        case NormalizedErrorKind.UnknownError:
            return "Something went wrong.";
    }
}

function asErrorLike(error: unknown): ErrorLike | undefined {
    if (error != null && typeof error === "object") {
        return error as ErrorLike;
    }

    return undefined;
}

function stringValue(value: unknown, key?: string): string | undefined {
    const resolvedValue = key != null && value != null && typeof value === "object"
        ? (value as Record<string, unknown>)[key]
        : value;

    return typeof resolvedValue === "string" && resolvedValue.trim() !== ""
        ? resolvedValue
        : undefined;
}

function numberValue(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value)
        ? value
        : undefined;
}

function retryAfterMsValue(errorLike?: ErrorLike): number | undefined {
    if (typeof errorLike?.getRetryAfterMs !== "function") {
        return undefined;
    }

    try {
        return numberValue(errorLike.getRetryAfterMs());
    } catch {
        return undefined;
    }
}

function messageIncludes(message: string | undefined, patterns: string[]): boolean {
    if (message == null) {
        return false;
    }

    const normalizedMessage = message.toLowerCase();
    return patterns.some(pattern => normalizedMessage.includes(pattern));
}
