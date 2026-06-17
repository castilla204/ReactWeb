// Almacenamiento local del borrador de inspección (datos + PDF rellenado).
// Usa IndexedDB porque el PDF y las fotos no caben en localStorage.
// Funciona igual en web móvil y escritorio; en Capacitor también (es el WebView).

const DB_NAME = 'inspecciono';
const STORE = 'inspecciones';

export interface InspectionRecord {
    hireId: string;
    values: Record<string, string>;
    pdf?: Blob;
    updatedAt: string;
}

function openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'hireId' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function saveInspection(record: InspectionRecord): Promise<void> {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
    db.close();
}

export async function loadInspection(hireId: string): Promise<InspectionRecord | null> {
    const db = await openDb();
    const result = await new Promise<InspectionRecord | null>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(hireId);
        req.onsuccess = () => resolve((req.result as InspectionRecord) ?? null);
        req.onerror = () => reject(req.error);
    });
    db.close();
    return result;
}
