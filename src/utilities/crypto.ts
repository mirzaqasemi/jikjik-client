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

const SIGN_GEN = {
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
};
const ENC_GEN = {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
};

// ─── Encoding helpers ──────────────────────────────────────────────────────────

function b64ToBytes(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

function bytesToB64(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    let s = "";
    const BLOCK = 0x8000;
    for (let i = 0; i < u8.length; i += BLOCK)
        s += String.fromCharCode(...u8.subarray(i, i + BLOCK));
    return btoa(s);
}

// ─── IndexedDB ─────────────────────────────────────────────────────────────────

function idbOpen() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbGet(key) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function idbPut(key, value) {
    const db = await idbOpen();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// ─── Cached private CryptoKeys (lazy-loaded from IDB) ─────────────────────────

let signPrivKey = null;
let encPrivKey = null;

// ─── Public-key import (for recipients' SPKI base64 strings) ──────────────────

async function importRsaKey(b64, format, usages, alg) {
    return crypto.subtle.importKey(format, b64ToBytes(b64), alg, true, usages);
}

// ─── Key setup ─────────────────────────────────────────────────────────────────
//
// On first run, generates two RSA keypairs with extractable=false on the
// private halves. The CryptoKey objects are stored in IndexedDB; the public
// halves are exported to SPKI base64 once and cached alongside for sending to
// the server at registration time.

async function setupKeys() {
    signPrivKey = await idbGet(SIGN_PRIV);
    encPrivKey = await idbGet(ENC_PRIV);
    let signPub = await idbGet(SIGN_PUB_B64);
    let encPub = await idbGet(ENC_PUB_B64);

    if (!signPrivKey || !encPrivKey || !signPub || !encPub) {
        const signKp = await crypto.subtle.generateKey(SIGN_GEN, false, ["sign", "verify"]);
        const encKp = await crypto.subtle.generateKey(ENC_GEN, false, ["encrypt", "decrypt"]);

        signPrivKey = signKp.privateKey;
        encPrivKey = encKp.privateKey;
        signPub = bytesToB64(await crypto.subtle.exportKey("spki", signKp.publicKey));
        encPub = bytesToB64(await crypto.subtle.exportKey("spki", encKp.publicKey));

        await idbPut(SIGN_PRIV, signPrivKey);
        await idbPut(ENC_PRIV, encPrivKey);
        await idbPut(SIGN_PUB_B64, signPub);
        await idbPut(ENC_PUB_B64, encPub);
    }

    return {signPublicKey: signPub, encPublicKey: encPub};
}

async function getDecryptKey() {
    if (!encPrivKey) encPrivKey = await idbGet(ENC_PRIV);
    return encPrivKey || null;
}

// ─── Request signing ───────────────────────────────────────────────────────────

async function signRequest(data) {
    if (!signPrivKey) signPrivKey = await idbGet(SIGN_PRIV);
    const username_val = localStorage.getItem("USERNAME");
    if (!signPrivKey || !username_val) throw new Error("Missing keys or username");

    const timestamp = Date.now();
    const expirationTime = timestamp + SIGNATURE_VALIDITY_MS;

    // Canonical JSON helper for consistent signature payload
    const sortedJson = (obj) => {
        const allKeys = Object.keys(obj).sort();
        const res = {};
        allKeys.forEach(k => {
            if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
                res[k] = sortedJson(obj[k]);
            } else {
                res[k] = obj[k];
            }
        });
        return res;
    };

    const fullObj = {data: data, expirationTime: expirationTime};
    const jsonStr = JSON.stringify(sortedJson(fullObj), null, 0);

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

async function signedFetch(url, data) {
    const headers = await signRequest(data);
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...headers
        },
        body: JSON.stringify(data)
    });
}

// ─── Exports ───────────────────────────────────────────────────────────────────

export {
    b64ToBytes,
    bytesToB64,
    importRsaKey,
    setupKeys,
    getDecryptKey,
    signRequest,
    signedFetch,
    SIGNATURE_VALIDITY_MS
};
