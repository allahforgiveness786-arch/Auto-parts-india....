
import { getApp as getAppInternal } from '@react-native-firebase/app';
import authModule, { firebase } from '@react-native-firebase/auth';
import firestoreModule from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { INITIAL_SPARE_PARTS } from '../data/mockData';

const FIREBASE_PROJECT_ID = 'auto-parts-market-place-20312';
const FIRESTORE_DB_ID = 'ai-studio-autopartsmarketp-6b6de595-2abc-431d-a6dc-0141a5eff96f';
const FIREBASE_API_KEY = 'AIzaSyBTfivYbxE7PDB7FxyAlJjFDid6LKPplx8';
const STORAGE_KEY_PREFIX = '@autoparts_firestore_';

export function getApp() {
  try {
    return getAppInternal();
  } catch (_) {
    return (firebase as any)?.app?.() || null;
  }
}

let cachedAuthUser: any = null;
const authListeners = new Set<(user: any) => void>();

// Initialize cached user from AsyncStorage on app load
AsyncStorage.getItem('@autoparts_current_user').then((val) => {
  if (val) {
    try {
      cachedAuthUser = JSON.parse(val);
      authListeners.forEach((cb) => {
        try { cb(cachedAuthUser); } catch (_) {}
      });
    } catch (_) {}
  }
}).catch(() => {});

export async function setCurrentAuthUser(user: any) {
  cachedAuthUser = user;
  try {
    if (user) {
      await AsyncStorage.setItem('@autoparts_current_user', JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem('@autoparts_current_user');
    }
  } catch (_) {}

  // Broadcast to all active listeners
  authListeners.forEach((cb) => {
    try { cb(cachedAuthUser); } catch (_) {}
  });
}

export function getFirebaseAuth(): any {
  try {
    let inst: any = null;
    if (typeof authModule === 'function') {
      try { inst = authModule(); } catch (_) {}
    }
    if (!inst && (authModule as any)?.default && typeof (authModule as any).default === 'function') {
      try { inst = (authModule as any).default(); } catch (_) {}
    }
    if (!inst && typeof (firebase as any)?.auth === 'function') {
      try { inst = (firebase as any).auth(); } catch (_) {}
    }
    if (!inst) {
      inst = authModule || {};
    }

    return {
      ...(typeof inst === 'object' ? inst : {}),
      get currentUser() {
        return (inst as any)?.currentUser || cachedAuthUser || null;
      },
      onAuthStateChanged: (callback: (user: any) => void) => {
        authListeners.add(callback);
        // Immediate callback with current value
        setTimeout(() => {
          try {
            callback(cachedAuthUser || (inst as any)?.currentUser || null);
          } catch (_) {}
        }, 10);

        let nativeUnsub: any = null;
        if (inst && typeof inst.onAuthStateChanged === 'function') {
          try {
            nativeUnsub = inst.onAuthStateChanged((u: any) => {
              if (u) {
                const mappedUser = {
                  uid: u.uid,
                  id: u.uid,
                  email: u.email || '',
                  displayName: u.displayName || u.email?.split('@')[0] || 'Auto Parts User',
                  name: u.displayName || u.email?.split('@')[0] || 'Auto Parts User',
                  photoURL: u.photoURL || '',
                };
                setCurrentAuthUser(mappedUser);
              }
            });
          } catch (_) {}
        }

        return () => {
          authListeners.delete(callback);
          if (nativeUnsub) {
            try { nativeUnsub(); } catch (_) {}
          }
        };
      },
      signOut: async () => {
        try {
          if (inst && typeof inst.signOut === 'function') {
            await inst.signOut();
          }
        } catch (_) {}
        await setCurrentAuthUser(null);
      },
    };
  } catch (err) {
    console.warn('[firebase.ts] getFirebaseAuth fallback:', err);
    return {
      get currentUser() {
        return cachedAuthUser || null;
      },
      onAuthStateChanged: (callback: (user: any) => void) => {
        authListeners.add(callback);
        setTimeout(() => {
          try { callback(cachedAuthUser); } catch (_) {}
        }, 10);
        return () => authListeners.delete(callback);
      },
      signOut: async () => {
        await setCurrentAuthUser(null);
      },
    };
  }
}

// -------------------------------------------------------------
// REAL CLOUD FIRESTORE REST ENGINE (Zero-Fail Direct Cloud Sync)
// -------------------------------------------------------------

function encodeFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(encodeFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = encodeFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

function decodeFirestoreValue(valObj: any): any {
  if (!valObj || typeof valObj !== 'object') return null;
  if ('stringValue' in valObj) return valObj.stringValue;
  if ('integerValue' in valObj) return parseInt(valObj.integerValue, 10);
  if ('doubleValue' in valObj) return parseFloat(valObj.doubleValue);
  if ('booleanValue' in valObj) return valObj.booleanValue;
  if ('nullValue' in valObj) return null;
  if ('arrayValue' in valObj) {
    return (valObj.arrayValue?.values || []).map(decodeFirestoreValue);
  }
  if ('mapValue' in valObj) {
    const res: Record<string, any> = {};
    const fields = valObj.mapValue?.fields || {};
    for (const [k, v] of Object.entries(fields)) {
      res[k] = decodeFirestoreValue(v);
    }
    return res;
  }
  if ('timestampValue' in valObj) return new Date(valObj.timestampValue).getTime();
  return null;
}

function decodeFirestoreDoc(docObj: any): any {
  if (!docObj || !docObj.name) return null;
  const nameParts = docObj.name.split('/');
  const docId = nameParts[nameParts.length - 1];
  const fields = docObj.fields || {};
  const data: Record<string, any> = { id: docId };
  for (const [k, v] of Object.entries(fields)) {
    data[k] = decodeFirestoreValue(v);
  }
  return {
    id: docId,
    data: () => ({ ...data }),
    exists: true,
    ...data,
  };
}

const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${FIRESTORE_DB_ID}/documents`;

// In-memory local cache synced with Cloud Firestore
const cloudCache: Record<string, Record<string, any>> = {};
const activeListeners: Record<string, Set<(snapshot: any) => void>> = {};

function notifyLocalSubscribers(collPath: string) {
  const listeners = activeListeners[collPath];
  if (!listeners || listeners.size === 0) return;
  const cachedDocs = Object.values(cloudCache[collPath] || {});
  const snapshot = {
    docs: cachedDocs.map((item) => ({
      id: item.id,
      data: () => ({ ...item }),
      exists: true,
    })),
    empty: cachedDocs.length === 0,
    size: cachedDocs.length,
    forEach: (cb: (d: any) => void) => {
      cachedDocs.forEach((item) => {
        cb({ id: item.id, data: () => ({ ...item }), exists: true });
      });
    },
  };
  listeners.forEach((cb) => {
    try { cb(snapshot); } catch (_) {}
  });
}

// Fetch real documents from Cloud Firestore
async function fetchCloudCollection(collPath: string): Promise<any[]> {
  try {
    const cleanPath = collPath.startsWith('/') ? collPath.substring(1) : collPath;
    const res = await fetch(`${firestoreBaseUrl}/${cleanPath}?key=${FIREBASE_API_KEY}&pageSize=100`);
    if (!res.ok) {
      console.warn(`[Firestore Cloud] HTTP ${res.status} reading ${cleanPath}`);
      return Object.values(cloudCache[collPath] || {});
    }
    const data = await res.json();
    const rawDocs = data.documents || [];
    const parsedDocs: any[] = [];
    if (!cloudCache[collPath]) cloudCache[collPath] = {};

    rawDocs.forEach((d: any) => {
      const decoded = decodeFirestoreDoc(d);
      if (decoded && decoded.id) {
        cloudCache[collPath][decoded.id] = { ...decoded };
        parsedDocs.push(decoded);
      }
    });

    try {
      await AsyncStorage.setItem(STORAGE_KEY_PREFIX + collPath, JSON.stringify(cloudCache[collPath]));
    } catch (_) {}

    notifyLocalSubscribers(collPath);
    return parsedDocs;
  } catch (err) {
    console.warn(`[Firestore Cloud] Fetch error for ${collPath}:`, err);
    return Object.values(cloudCache[collPath] || {});
  }
}

// Write document to Cloud Firestore
async function writeCloudDoc(collPath: string, docId: string, data: any, isMerge = false): Promise<void> {
  try {
    const cleanPath = collPath.startsWith('/') ? collPath.substring(1) : collPath;
    if (!cloudCache[collPath]) cloudCache[collPath] = {};
    const existing = cloudCache[collPath][docId] || {};
    const merged = isMerge ? { ...existing, ...data, id: docId } : { id: docId, ...data };
    cloudCache[collPath][docId] = merged;
    notifyLocalSubscribers(collPath);

    try {
      await AsyncStorage.setItem(STORAGE_KEY_PREFIX + collPath, JSON.stringify(cloudCache[collPath]));
    } catch (_) {}

    // Encode fields for Firestore REST API
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(merged)) {
      if (k !== 'id') {
        fields[k] = encodeFirestoreValue(v);
      }
    }

    const patchUrl = `${firestoreBaseUrl}/${cleanPath}/${docId}?key=${FIREBASE_API_KEY}`;
    await fetch(patchUrl, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (err) {
    console.warn(`[Firestore Cloud] Write error to ${collPath}/${docId}:`, err);
  }
}

// Delete document from Cloud Firestore
async function deleteCloudDoc(collPath: string, docId: string): Promise<void> {
  try {
    const cleanPath = collPath.startsWith('/') ? collPath.substring(1) : collPath;
    if (cloudCache[collPath]) {
      delete cloudCache[collPath][docId];
      notifyLocalSubscribers(collPath);
      try {
        await AsyncStorage.setItem(STORAGE_KEY_PREFIX + collPath, JSON.stringify(cloudCache[collPath]));
      } catch (_) {}
    }
    await fetch(`${firestoreBaseUrl}/${cleanPath}/${docId}?key=${FIREBASE_API_KEY}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn(`[Firestore Cloud] Delete error for ${collPath}/${docId}:`, err);
  }
}

// Pre-load from AsyncStorage cache on boot
['spareParts', 'products/listings/items', 'users', 'chats'].forEach((coll) => {
  AsyncStorage.getItem(STORAGE_KEY_PREFIX + coll).then((val) => {
    if (val) {
      try {
        cloudCache[coll] = JSON.parse(val);
      } catch (_) {}
    }
  }).catch(() => {});
});

function createRealFirestoreQuery(collectionPath: string) {
  let whereClauses: { field: string; op: string; val: any }[] = [];
  let orderField: string | null = null;
  let orderDirection: 'asc' | 'desc' = 'desc';
  let limitCount: number | null = null;

  const queryObj = {
    where: (field: string, op: string, val: any) => {
      whereClauses.push({ field, op, val });
      return queryObj;
    },
    orderBy: (field: string, dir: 'asc' | 'desc' = 'asc') => {
      orderField = field;
      orderDirection = dir;
      return queryObj;
    },
    limit: (n: number) => {
      limitCount = n;
      return queryObj;
    },
    get: async () => {
      const liveDocs = await fetchCloudCollection(collectionPath);
      let filtered = [...liveDocs];

      // Apply in-memory filtering on fetched documents
      whereClauses.forEach(({ field, op, val }) => {
        filtered = filtered.filter((d) => {
          const itemVal = d[field];
          if (op === '==' || op === '===') return itemVal === val;
          if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(val);
          if (op === 'in') return Array.isArray(val) && val.includes(itemVal);
          if (op === '>') return itemVal > val;
          if (op === '<') return itemVal < val;
          if (op === '>=') return itemVal >= val;
          if (op === '<=') return itemVal <= val;
          return true;
        });
      });

      if (orderField) {
        filtered.sort((a, b) => {
          const va = a[orderField!];
          const vb = b[orderField!];
          if (va < vb) return orderDirection === 'asc' ? -1 : 1;
          if (va > vb) return orderDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }

      if (limitCount && limitCount > 0) {
        filtered = filtered.slice(0, limitCount);
      }

      const docs = filtered.map((d) => ({
        id: d.id,
        data: () => ({ ...d }),
        exists: true,
      }));

      return {
        docs,
        empty: docs.length === 0,
        size: docs.length,
        forEach: (cb: (doc: any) => void) => docs.forEach(cb),
      };
    },
    onSnapshot: (onNext: (snap: any) => void, _onError?: (err: any) => void) => {
      if (!activeListeners[collectionPath]) {
        activeListeners[collectionPath] = new Set();
      }

      const subscriber = (snap: any) => {
        let filteredDocs = snap.docs || [];
        whereClauses.forEach(({ field, op, val }) => {
          filteredDocs = filteredDocs.filter((d: any) => {
            const data = typeof d.data === 'function' ? d.data() : d;
            const itemVal = data[field];
            if (op === '==' || op === '===') return itemVal === val;
            if (op === 'array-contains') return Array.isArray(itemVal) && itemVal.includes(val);
            if (op === 'in') return Array.isArray(val) && val.includes(itemVal);
            return true;
          });
        });

        onNext({
          docs: filteredDocs,
          empty: filteredDocs.length === 0,
          size: filteredDocs.length,
          forEach: (cb: (doc: any) => void) => filteredDocs.forEach(cb),
        });
      };

      activeListeners[collectionPath].add(subscriber);

      // Trigger initial cloud fetch
      fetchCloudCollection(collectionPath).then((items) => {
        subscriber({
          docs: items.map((i) => ({ id: i.id, data: () => ({ ...i }), exists: true })),
        });
      });

      return () => {
        activeListeners[collectionPath]?.delete(subscriber);
      };
    },
    doc: (docId: string) => {
      const docPath = `${collectionPath}/${docId}`;
      return {
        id: docId,
        collection: (subCollName: string) => createRealFirestoreQuery(`${docPath}/${subCollName}`),
        get: async () => {
          try {
            const res = await fetch(`${firestoreBaseUrl}/${docPath}?key=${FIREBASE_API_KEY}`);
            if (res.ok) {
              const data = await res.json();
              const decoded = decodeFirestoreDoc(data);
              if (decoded) {
                if (!cloudCache[collectionPath]) cloudCache[collectionPath] = {};
                cloudCache[collectionPath][docId] = decoded;
                return {
                  id: docId,
                  data: () => ({ ...decoded }),
                  exists: true,
                };
              }
            }
          } catch (_) {}

          const cached = cloudCache[collectionPath]?.[docId];
          return {
            id: docId,
            data: () => cached ? { ...cached } : null,
            exists: Boolean(cached),
          };
        },
        set: async (data: any, options?: { merge?: boolean }) => {
          await writeCloudDoc(collectionPath, docId, data, Boolean(options?.merge));
        },
        update: async (data: any) => {
          await writeCloudDoc(collectionPath, docId, data, true);
        },
        delete: async () => {
          await deleteCloudDoc(collectionPath, docId);
        },
        onSnapshot: (onNext: (docSnap: any) => void, _onError?: (err: any) => void) => {
          const fetchAndNotify = async () => {
            try {
              const res = await fetch(`${firestoreBaseUrl}/${docPath}?key=${FIREBASE_API_KEY}`);
              if (res.ok) {
                const data = await res.json();
                const decoded = decodeFirestoreDoc(data);
                if (decoded) {
                  onNext({ id: docId, data: () => ({ ...decoded }), exists: true });
                  return;
                }
              }
            } catch (_) {}
            const cached = cloudCache[collectionPath]?.[docId];
            onNext({ id: docId, data: () => cached ? { ...cached } : null, exists: Boolean(cached) });
          };
          fetchAndNotify();
          return () => {};
        },
      };
    },
    add: async (data: any) => {
      const docId = 'part_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const fullDoc = { id: docId, ...data, createdAt: data.createdAt || Date.now() };
      await writeCloudDoc(collectionPath, docId, fullDoc, false);
      return {
        id: docId,
        get: async () => ({ id: docId, data: () => fullDoc, exists: true }),
      };
    },
  };

  return queryObj;
}

export function getFirebaseFirestore(): any {
  return {
    collection: (collName: string) => createRealFirestoreQuery(collName),
    doc: (path: string) => {
      const parts = path.split('/');
      if (parts.length >= 2) {
        const coll = parts.slice(0, parts.length - 1).join('/');
        const docId = parts[parts.length - 1];
        return createRealFirestoreQuery(coll).doc(docId);
      }
      return createRealFirestoreQuery(path).doc('default');
    },
  };
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
export const getFirestoreInstance = getFirebaseFirestore;
export default getFirebaseAuth;



