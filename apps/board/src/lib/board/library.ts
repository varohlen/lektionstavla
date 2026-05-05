import type { BoardLibraryItemKind, BoardLibraryItemV1, PortableBoardDocumentV1 } from "./types";

const DB_NAME = "lektionsvy-library";
const DB_VERSION = 1;
const STORE_NAME = "boards";

type BoardLibraryInput = {
  id?: string;
  name: string;
  kind: BoardLibraryItemKind;
  board: PortableBoardDocumentV1;
};

function generateBoardId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `board-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("kind", "kind");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function wrapRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listBoardLibraryItems(): Promise<BoardLibraryItemV1[]> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const items = (await wrapRequest(store.getAll())) as BoardLibraryItemV1[];

    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } finally {
    db.close();
  }
}

export async function getBoardLibraryItem(id: string): Promise<BoardLibraryItemV1 | null> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const item = (await wrapRequest(store.get(id))) as BoardLibraryItemV1 | undefined;

    return item ?? null;
  } finally {
    db.close();
  }
}

export async function saveBoardLibraryItem(input: BoardLibraryInput): Promise<BoardLibraryItemV1> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const item: BoardLibraryItemV1 = {
      id: input.id ?? generateBoardId(),
      name: input.name.trim() || "Namnlös tavla",
      kind: input.kind,
      updatedAt: new Date().toISOString(),
      board: input.board,
    };

    await wrapRequest(store.put(item));

    return item;
  } finally {
    db.close();
  }
}

export async function deleteBoardLibraryItem(id: string): Promise<void> {
  const db = await openDatabase();

  try {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    await wrapRequest(store.delete(id));
  } finally {
    db.close();
  }
}
