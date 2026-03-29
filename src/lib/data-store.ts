import { db } from '@/lib/db';

export function getDataStore() {
  return {
    firestore: db,
    db,
  };
}
