export class IndexedDb {
    private readonly name: string;
    private readonly store: string;

    constructor(name: string, store:string) {
        this.name = name;
        this.store = store;
    }

    private open(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(this.name, 1);
            req.onupgradeneeded = () => {
                if (!req.result.objectStoreNames.contains(this.store)) {
                    req.result.createObjectStore(this.store);
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    public async get<T>(key: string[]): Promise<T | undefined> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.store, "readonly");
            const req = tx.objectStore(this.store).get(key);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    async put(key: string[], value: CryptoKey | string): Promise<void> {
        const db = await this.open();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.store, "readwrite");
            tx.objectStore(this.store).put(value, key);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
}
