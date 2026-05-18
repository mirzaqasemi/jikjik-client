// ─── security.ts ───────────────────────────────────────────────────────────────
// Cryptographic key management, signing, and authentication.
//
// Private keys are non-extractable CryptoKey objects stored directly in
// IndexedDB (structured-cloned, never exported). Two keypairs are used:
//   • RSASSA-PKCS1-v1_5 for request signing
//   • RSA-OAEP          for message/file-key decryption
const SIGNATURE_VALIDITY_MS = 2000;

const DB_NAME = "crypto-keys";
const STORE = "keys";

const SIGN_PRIV = "sign_priv";
const ENC_PRIV = "enc_priv";
const SIGN_PUB_B64 = "sign_pub_b64";
const ENC_PUB_B64 = "enc_pub_b64";

type StoredKeyName =
    | typeof SIGN_PRIV
    | typeof ENC_PRIV
    | typeof SIGN_PUB_B64
    | typeof ENC_PUB_B64;

type StoredKeys = {
    signPrivKey: CryptoKey | null;
    encPrivKey: CryptoKey | null;
    signPub: string | null;
    encPub: string | null;
};

type CompleteStoredKeys = {
    signPrivKey: CryptoKey;
    encPrivKey: CryptoKey;
    signPub: string;
    encPub: string;
};

type JsonValue =
    | null
    | string
    | number
    | boolean
    | JsonValue[]
    | { [key: string]: JsonValue };

type SignedHeaders = {
    "X-Signature": string;
    "X-Timestamp": string;
    "X-Username": string;
};

type BinaryKeyFormat = Exclude<KeyFormat, "jwk">;

const SIGN_GEN: RsaHashedKeyGenParams = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
};
const ENC_GEN: RsaHashedKeyGenParams = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
};

// ─── Encoding helpers ──────────────────────────────────────────────────────────

function b64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}

function bytesToB64(buf: ArrayBuffer | Uint8Array<ArrayBufferLike>): string {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = "";
    const BLOCK = 0x8000;
    for (let i = 0; i < u8.length; i += BLOCK)
        s += String.fromCharCode(...u8.subarray(i, i + BLOCK));
    return btoa(s);
}

// ─── IndexedDB ─────────────────────────────────────────────────────────────────

function idbOpen(dbName = DB_NAME): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, 1);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE)) {
                req.result.createObjectStore(STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbGet<T>(key: StoredKeyName, dbName = DB_NAME): Promise<T | undefined> {
    const db = await idbOpen(dbName);
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbPut(key: StoredKeyName, value: CryptoKey | string): Promise<void> {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ─── Cached private CryptoKeys (lazy-loaded from IDB) ─────────────────────────

let signPrivKey: CryptoKey | null = null;
let encPrivKey: CryptoKey | null = null;

// ─── Public-key import (for recipients' SPKI base64 strings) ──────────────────

async function importRsaKey(
    b64: string,
    format: BinaryKeyFormat,
    usages: KeyUsage[],
    alg: AlgorithmIdentifier
): Promise<CryptoKey> {
    return crypto.subtle.importKey(format, b64ToBytes(b64), alg, true, usages);
}

async function loadStoredKeys(dbName = DB_NAME): Promise<StoredKeys> {
    return {
        signPrivKey: await idbGet<CryptoKey>(SIGN_PRIV, dbName) ?? null,
        encPrivKey: await idbGet<CryptoKey>(ENC_PRIV, dbName) ?? null,
        signPub: await idbGet<string>(SIGN_PUB_B64, dbName) ?? null,
        encPub: await idbGet<string>(ENC_PUB_B64, dbName) ?? null
    };
}

function hasCompleteKeySet(keys: StoredKeys): keys is CompleteStoredKeys {
    return Boolean(keys.signPrivKey && keys.encPrivKey && keys.signPub && keys.encPub);
}

async function saveStoredKeys(keys: CompleteStoredKeys): Promise<void> {
    await idbPut(SIGN_PRIV, keys.signPrivKey);
    await idbPut(ENC_PRIV, keys.encPrivKey);
    await idbPut(SIGN_PUB_B64, keys.signPub);
    await idbPut(ENC_PUB_B64, keys.encPub);
}

// ─── Key setup ─────────────────────────────────────────────────────────────────
//
// On first run, generates two RSA keypairs with extractable=false on the
// private halves. The CryptoKey objects are stored in IndexedDB; the public
// halves are exported to SPKI base64 once and cached alongside for sending to
// the server at registration time.

async function setupKeys(): Promise<{ signPublicKey: string; encPublicKey: string }> {
    const storedKeys = await loadStoredKeys();
    let keys: CompleteStoredKeys | null = hasCompleteKeySet(storedKeys) ? storedKeys : null;

    if (!keys) {
        const signKp = await crypto.subtle.generateKey(SIGN_GEN, false, ["sign", "verify"]);
        const encKp = await crypto.subtle.generateKey(ENC_GEN, false, ["encrypt", "decrypt"]);

        keys = {
            signPrivKey: signKp.privateKey,
            encPrivKey: encKp.privateKey,
            signPub: bytesToB64(await crypto.subtle.exportKey("spki", signKp.publicKey)),
            encPub: bytesToB64(await crypto.subtle.exportKey("spki", encKp.publicKey))
        };

        await saveStoredKeys(keys);
    }

    signPrivKey = keys.signPrivKey;
    encPrivKey = keys.encPrivKey;

    return {signPublicKey: keys.signPub, encPublicKey: keys.encPub};
}

async function getDecryptKey(): Promise<CryptoKey | null> {
    if (!encPrivKey) encPrivKey = await idbGet<CryptoKey>(ENC_PRIV) ?? null;
    return encPrivKey || null;
}

// ─── Request signing ───────────────────────────────────────────────────────────

function canonicalize(value: JsonValue): JsonValue {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    if (typeof value !== "object" || value === null) {
        return value;
    }

    return Object.keys(value).sort().reduce<{ [key: string]: JsonValue }>((res, key) => {
        res[key] = canonicalize(value[key]);
        return res;
    }, {});
}

async function signRequest(data: JsonValue, method: string): Promise<SignedHeaders> {
    if (!signPrivKey) signPrivKey = await idbGet<CryptoKey>(SIGN_PRIV) ?? null;
    const username_val = localStorage.getItem("username") ?? localStorage.getItem("USERNAME");
    if (!signPrivKey || !username_val) throw new Error("Missing keys or username");

    const timestamp = Date.now();
    const expirationTime = timestamp + SIGNATURE_VALIDITY_MS;

    const fullObj = {data: data, expirationTime: expirationTime, method: method};
    const jsonStr = JSON.stringify(canonicalize(fullObj), null, 0);

    const sig = await crypto.subtle.sign(
        {name: "RSASSA-PKCS1-v1_5"},
        signPrivKey,
        new TextEncoder().encode(jsonStr)
    );

    return {
        "X-Signature": bytesToB64(sig),
        "X-Timestamp": timestamp.toString(),
        "X-Username": username_val
    };
}

// ─── Exports ───────────────────────────────────────────────────────────────────

export {
    b64ToBytes,
    bytesToB64,
    importRsaKey,
    setupKeys,
    getDecryptKey,
    signRequest,
    SIGNATURE_VALIDITY_MS
};
