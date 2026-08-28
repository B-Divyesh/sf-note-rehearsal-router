import type { RouterState } from './types';
import { initialState } from './router';

const STATE_KEY = 'router-state';
const DATABASE = 'note-rehearsal-router';
const HANDLE_STORE = 'handles';
const ROOT_HANDLE = 'root-directory';

export async function loadState(): Promise<RouterState> {
  const result = await chrome.storage.local.get(STATE_KEY);
  const state = result[STATE_KEY] as RouterState | undefined;
  return state?.version === 1 ? state : initialState();
}

export async function saveState(state: RouterState): Promise<void> {
  await chrome.storage.local.set({ [STATE_KEY]: state });
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(HANDLE_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function handleTransaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE, mode);
    const request = action(transaction.objectStore(HANDLE_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

export function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<IDBValidKey> {
  return handleTransaction('readwrite', (store) => store.put(handle, ROOT_HANDLE));
}

export function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return handleTransaction('readonly', (store) => store.get(ROOT_HANDLE));
}

export async function clearLocalData(): Promise<void> {
  await chrome.storage.local.clear();
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(HANDLE_STORE, 'readwrite');
    transaction.objectStore(HANDLE_STORE).clear();
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
