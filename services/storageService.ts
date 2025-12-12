import { AnyItem, Collection, AppMode, ItemType } from "../types";

// This service mocks the OPFS + SQLite WASM layer. 
// In a full implementation, this would contain the Worker communication logic.

const STORE_KEY_ITEMS = 'nexus_items';
const STORE_KEY_COLLECTIONS = 'nexus_collections';

const INITIAL_COLLECTIONS: Collection[] = [
  { id: '1', name: 'My Research', mode: AppMode.RESEARCH, description: 'General research notes', pinned: true },
  { id: '2', name: 'AI Papers', mode: AppMode.RESEARCH, description: 'LLM and Transformer papers' },
  { id: '3', name: 'Personal Finance', mode: AppMode.FINANCE, description: 'Monthly expenses', pinned: true },
  { id: '4', name: 'Work Calendar', mode: AppMode.CALENDAR, description: 'Meetings and deadlines' },
  { id: '5', name: 'Project Alpha', mode: AppMode.PROJECTS, description: 'App development roadmap' },
];

export const getCollections = (): Collection[] => {
  const stored = localStorage.getItem(STORE_KEY_COLLECTIONS);
  if (!stored) {
    localStorage.setItem(STORE_KEY_COLLECTIONS, JSON.stringify(INITIAL_COLLECTIONS));
    return INITIAL_COLLECTIONS;
  }
  return JSON.parse(stored);
};

export const getItems = (collectionId: string): AnyItem[] => {
  const stored = localStorage.getItem(STORE_KEY_ITEMS);
  const allItems: AnyItem[] = stored ? JSON.parse(stored) : [];
  // For demo simplicity, we associate items to collections via a 'collectionId' property 
  // we add dynamically in the UI logic, or filter here.
  // In this mock, we'll assume we filter by a property stored on the item (simulated).
  return allItems.filter((i: any) => i.collectionId === collectionId);
};

export const saveItem = (collectionId: string, item: AnyItem): void => {
  const stored = localStorage.getItem(STORE_KEY_ITEMS);
  const allItems: AnyItem[] = stored ? JSON.parse(stored) : [];
  
  // Tag with collection ID for our mock filter
  (item as any).collectionId = collectionId;
  
  allItems.push(item);
  localStorage.setItem(STORE_KEY_ITEMS, JSON.stringify(allItems));
};

export const getAllItemsFlat = (): AnyItem[] => {
    const stored = localStorage.getItem(STORE_KEY_ITEMS);
    return stored ? JSON.parse(stored) : [];
}
