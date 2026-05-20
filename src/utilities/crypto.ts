import { Base64 } from "@/utilities/encoding.ts";

const RSA_PARAMS = {name: "RSA-OAEP", hash: "SHA-256"};

type BinaryKeyFormat = Exclude<KeyFormat, "jwk">;

async function importRsaKey(
    b64: string,
    format: BinaryKeyFormat,
    usages: KeyUsage[],
    alg: AlgorithmIdentifier
): Promise<CryptoKey> {
    return crypto.subtle.importKey(format, Base64.toBytes(b64), alg, true, usages);
}

async function rsaDecrypt(b64Ciphertext: string, key: CryptoKey) {
    if (!key) return null;
    return crypto.subtle
        .decrypt({name: "RSA-OAEP"}, key, Base64.toBytes(b64Ciphertext))
        .catch(() => null);
}

async function rsaEncrypt(data: Uint8Array<ArrayBuffer>, pubKeyB64: string) {
    const key = await importRsaKey(pubKeyB64, "spki", ["encrypt"], RSA_PARAMS);
    return Base64.fromBytes(await crypto.subtle.encrypt({name: "RSA-OAEP"}, key, data));
}

export const Rsa = {
    decrypt: rsaDecrypt, encrypt: rsaEncrypt
}
