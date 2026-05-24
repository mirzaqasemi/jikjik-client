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

export const Base64 = {
    toBytes: b64ToBytes,
    fromBytes: bytesToB64,
}
