import { mustGetUser } from "@/services/session.ts";
import { IndexedDb } from "@/utilities/index-db.ts";
import { Base64 } from "@/utilities/encoding.ts";
import { Rsa } from "@/utilities/crypto.ts";

const SIGNATURE_VALIDITY_MS = 2000;

const DB_NAME = "crypto-keys";
const STORE = "keys";

const db = new IndexedDb(DB_NAME, STORE);

const SIGN_PRIV = "sign_priv";
const ENC_PRIV = "enc_priv";
const SIGN_PUB_B64 = "sign_pub_b64";
const ENC_PUB_B64 = "enc_pub_b64";

type JsonValue =
    | null
    | string
    | number
    | boolean
    | JsonValue[]
    | { [key: string]: JsonValue };

export type Keys = {
    signPrivKey: CryptoKey;
    encPrivKey: CryptoKey;
    signPub: string;
    encPub: string;
};

type SignedHeaders = {
    "X-Signature": string;
    "X-Timestamp": string;
    "X-Username": string;
};

const SIGN_ALGORITHM = "RSASSA-PKCS1-v1_5";
const SIGN_GEN: RsaHashedKeyGenParams = {
    name: SIGN_ALGORITHM,
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

// ─── Cached private CryptoKeys (lazy-loaded from IDB) ─────────────────────────
let signPrivKey: CryptoKey | null = null;
let encPrivKey: CryptoKey | null = null;

async function loadKeys(username: string): Promise<Keys | null> {
    const keys = {
        signPrivKey: await db.get<CryptoKey>([username, SIGN_PRIV]) ?? null,
        encPrivKey: await db.get<CryptoKey>([username, ENC_PRIV]) ?? null,
        signPub: await db.get<string>([username, SIGN_PUB_B64]) ?? null,
        encPub: await db.get<string>([username, ENC_PUB_B64]) ?? null
    };
    if (keys.signPrivKey && keys.encPrivKey && keys.signPub && keys.encPub) {
        return keys as Keys;
    }
    return null;
}

async function storeKeys(username: string, keys: Keys): Promise<void> {
    await db.put([username, SIGN_PRIV], keys.signPrivKey);
    await db.put([username, ENC_PRIV], keys.encPrivKey);
    await db.put([username, SIGN_PUB_B64], keys.signPub);
    await db.put([username, ENC_PUB_B64], keys.encPub);
}

export async function setupKeys(username: string, registerKeys: (keys: Keys) => Promise<void>): Promise<{
    signPublicKey: string;
    encPublicKey: string;
}> {
    let keys = await loadKeys(username);
    if (keys == null) {
        const signKp = await crypto.subtle.generateKey(SIGN_GEN, false, ["sign", "verify"]);
        const encKp = await crypto.subtle.generateKey(ENC_GEN, false, ["encrypt", "decrypt"]);

        keys = {
            signPrivKey: signKp.privateKey,
            encPrivKey: encKp.privateKey,
            signPub: Base64.fromBytes(await crypto.subtle.exportKey("spki", signKp.publicKey)),
            encPub: Base64.fromBytes(await crypto.subtle.exportKey("spki", encKp.publicKey))
        };

        await registerKeys(keys);
        await storeKeys(username, keys);
    }

    signPrivKey = keys.signPrivKey;
    encPrivKey = keys.encPrivKey;

    return {signPublicKey: keys.signPub, encPublicKey: keys.encPub};
}

export async function getDecryptKey(): Promise<CryptoKey | null> {
    if (!encPrivKey) encPrivKey = await db.get<CryptoKey>([mustGetUser().username, ENC_PRIV]) ?? null;
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

export async function signRequest(username: string, data: {
    [key: string]: JsonValue
}, method: string, signPrivateKey?: CryptoKey): Promise<SignedHeaders> {
    if (!signPrivateKey) {
        if (!signPrivKey) signPrivKey = await db.get<CryptoKey>([username, SIGN_PRIV]) ?? null;
        signPrivateKey = signPrivKey || undefined;
    }
    if (!signPrivateKey || !username) throw new Error("Missing keys or username");

    const timestamp = Date.now();
    const expirationTime = timestamp + SIGNATURE_VALIDITY_MS;

    const fullObj = {data: data, expirationTime: expirationTime, method: method};
    const jsonStr = JSON.stringify(canonicalize(fullObj), null, 0);

    const sig = await crypto.subtle.sign(
        {name: SIGN_ALGORITHM},
        signPrivateKey,
        new TextEncoder().encode(jsonStr)
    );

    return {
        "X-Signature": Base64.fromBytes(sig),
        "X-Timestamp": timestamp.toString(),
        "X-Username": username
    };
}

export async function encryptTextMessage(text: string, pubKeyB64: string) {
    return Rsa.encrypt(new TextEncoder().encode(text), pubKeyB64);
}

export async function decryptTextMessage(b64Ciphertext: string): Promise<string> {
    const key = await getDecryptKey();
    if (!key) throw Error("No decryption key found");

    const buf = await Rsa.decrypt(b64Ciphertext, key);
    if (!buf) throw Error("cannot decrypt message");
    return new TextDecoder().decode(buf);
}
