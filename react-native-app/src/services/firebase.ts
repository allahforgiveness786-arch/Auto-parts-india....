
import { getApp as getAppInternal } from '@react-native-firebase/app';
import authModule, { firebase } from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_SPARE_PARTS } from '../data/mockData';

const FIRESTORE_DB_ID = 'ai-studio-autopartsmarketp-6b6de595-2abc-431d-a6dc-0141a5eff96f';
const STORAGE_KEY_PREFIX = '@autoparts_firestore_';

export function getApp() {
  try {
    return getAppInternal();
  } catch (_) {
    return (firebase as any)?.app?.() || null;
  }
}

export function getFirebaseAuth(): any {
  try {
    if (typeof authModule === 'function') {
      return authModule();
    }
    if (typeof (firebase as any)?.auth === 'function') {
      return (firebase as any).auth();
    }
    return authModule || null;
  } catch (err) {
    console.warn('[firebase.ts] getFirebaseAuth fallback:', err);
    return (firebase as any)?.auth?.() || null;
  }
}

// In-memory collection fallback
const memoryStore: Record<string, Record<string, any>> = {
  spareParts: {},
  'products/listings/items': {}
};

// Seed initial memory store with mock parts
INITIAL_SPARE_PARTS.forEach((part) => {
  memoryStore.spareParts[part.id] = { ...part };
  memoryStore['products/listings/items'][part.id] = { ...part };
});

// Load persisted items from AsyncStorage
AsyncStorage.getItem(STORAGE_KEY_PREFIX + 'spareParts').then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      Object.assign(memoryStore.spareParts, parsed);
      Object.assign(memoryStore['products/listings/items'], parsed);
    } catch (_) {}
  }
}).catch(() => {});

const listeners: Record<string, Set<(docs: any[]) => void>> = {};

function notifyListeners(collectionName: string) {
  const collectionKey = collectionName === 'products/listings/items' ? 'spareParts' : collectionName;
  const docs = Object.values(memoryStore[collectionKey] || memoryStore.spareParts || {});
  const set = listeners[collectionName] || listeners[collectionKey];
  if (set) {
    set.forEach((cb) => cb(docs));
  }
}

function createFallbackCollection(collectionName: string) {
  const collKey = collectionName === 'products/listings/items' ? 'spareParts' : collectionName;
  if (!memoryStore[collKey]) {
    memoryStore[collKey] = {};
  }

  const queryObj = {
    orderBy: (_field: string, _dir?: string) => queryObj,
    where: (_field: string, _op: string, _val: any) => queryObj,
    limit: (_n: number) => queryObj,
    get: async () => {
      const docs = Object.entries(memoryStore[collKey] || {}).map(([id, data]) => ({
        id,
        data: () => ({ ...data }),
        exists: true
      }));
      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach: (callback: (doc: any) => void) => docs.forEach(callback)
      };
    },
    onSnapshot: (onNext: (snapshot: any) => void, _onError?: (err: any) => void) => {
      if (!listeners[collectionName]) {
        listeners[collectionName] = new Set();
      }
      const listenerCallback = (docsList: any[]) => {
        const docItems = docsList.map((item) => ({
          id: item.id,
          data: () => ({ ...item }),
          exists: true
        }));
        onNext({
          docs: docItems,
          empty: docItems.length === 0,
          size: docItems.length,
          forEach: (cb: (d: any) => void) => docItems.forEach(cb)
        });
      };
      listeners[collectionName].add(listenerCallback);

      // Trigger initial call
      setTimeout(() => {
        const initialDocs = Object.values(memoryStore[collKey] || {});
        listenerCallback(initialDocs);
      }, 50);

      return () => {
        listeners[collectionName]?.delete(listenerCallback);
      };
    },
    add: async (data: any) => {
      const id = 'part-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
      const newDoc = { id, ...data, createdAt: data.createdAt || Date.now() };
      memoryStore[collKey][id] = newDoc;
      if (collKey === 'spareParts') {
        memoryStore['products/listings/items'][id] = newDoc;
      }
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_PREFIX + collKey,
          JSON.stringify(memoryStore[collKey])
        );
      } catch (_) {}
      notifyListeners(collectionName);
      return { id, get: async () => ({ id, data: () => newDoc, exists: true }) };
    },
    doc: (docId: string) => {
      return {
        id: docId,
        get: async () => {
          const item = memoryStore[collKey][docId];
          return {
            id: docId,
            data: () => item || null,
            exists: !!item
          };
        },
        set: async (data: any, options?: { merge?: boolean }) => {
          if (options?.merge && memoryStore[collKey][docId]) {
            memoryStore[collKey][docId] = { ...memoryStore[collKey][docId], ...data };
          } else {
            memoryStore[collKey][docId] = { id: docId, ...data };
          }
          try {
            await AsyncStorage.setItem(
              STORAGE_KEY_PREFIX + collKey,
              JSON.stringify(memoryStore[collKey])
            );
          } catch (_) {}
          notifyListeners(collectionName);
        },
        update: async (data: any) => {
          if (memoryStore[collKey][docId]) {
            memoryStore[collKey][docId] = { ...memoryStore[collKey][docId], ...data };
            try {
              await AsyncStorage.setItem(
                STORAGE_KEY_PREFIX + collKey,
                JSON.stringify(memoryStore[collKey])
              );
            } catch (_) {}
            notifyListeners(collectionName);
          }
        },
        delete: async () => {
          delete memoryStore[collKey][docId];
          try {
            await AsyncStorage.setItem(
              STORAGE_KEY_PREFIX + collKey,
              JSON.stringify(memoryStore[collKey])
            );
          } catch (_) {}
          notifyListeners(collectionName);
        }
      };
    }
  };

  return queryObj;
}

const fallbackFirestoreInstance = {
  collection: (collectionName: string) => createFallbackCollection(collectionName),
  doc: (path: string) => {
    const parts = path.split('/');
    if (parts.length >= 2) {
      const coll = parts.slice(0, parts.length - 1).join('/');
      const docId = parts[parts.length - 1];
      return createFallbackCollection(coll).doc(docId);
    }
    return createFallbackCollection(path).doc('default');
  }
};

export function getFirebaseFirestore(): any {
  try {
    let nativeDb: any = null;
    const currentApp = getApp();

    if (typeof firestoreModule === 'function') {
      try {
        if (currentApp) {
          nativeDb = firestoreModule(currentApp, FIRESTORE_DB_ID);
        } else {
          nativeDb = firestoreModule();
        }
      } catch (_) {
        try {
          nativeDb = firestoreModule();
        } catch (_) {}
      }
    }

    if (!nativeDb && typeof (firebase as any)?.firestore === 'function') {
      try {
        nativeDb = (firebase as any).firestore();
      } catch (_) {}
    }

    if (nativeDb && typeof nativeDb.collection === 'function') {
      // Wrap native db to automatically fall back if native query fails
      return {
        ...nativeDb,
        collection: (collectionName: string) => {
          try {
            const nativeColl = nativeDb.collection(collectionName);
            return nativeColl || createFallbackCollection(collectionName);
          } catch (_) {
            return createFallbackCollection(collectionName);
          }
        },
        doc: (path: string) => {
          try {
            const nativeDoc = nativeDb.doc(path);
            return nativeDoc || fallbackFirestoreInstance.doc(path);
          } catch (_) {
            return fallbackFirestoreInstance.doc(path);
          }
        }
      };
    }

    return fallbackFirestoreInstance;
  } catch (err) {
    console.warn('[firebase.ts] Using resilient fallback Firestore:', err);
    return fallbackFirestoreInstance;
  }
}

export function getCurrentUser(): any {
  try {
    const authInst = getFirebaseAuth();
    return authInst?.currentUser || null;
  } catch (_) {
    return null;
  }
}

export const app = getApp();
export const auth = getFirebaseAuth();
export const firestore = getFirebaseFirestore;
export default getFirebaseAuth;


