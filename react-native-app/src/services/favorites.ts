import { useState, useEffect } from 'react';
import { getFirebaseFirestore, getCurrentUser } from './firebase';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const user = getCurrentUser();
  const userId = user?.uid || user?.id;

  useEffect(() => {
    let unsub = () => {};
    if (userId) {
      try {
        const db = getFirebaseFirestore();
        if (db && typeof db.collection === 'function') {
          unsub = db.collection('favorites').where('userId', '==', userId).onSnapshot((snap: any) => {
            const favIds: string[] = [];
            snap.forEach((doc: any) => favIds.push(doc.data().partId));
            setFavorites(favIds);
          });
        }
      } catch (err) {
        console.warn('Error syncing favs', err);
      }
    }
    return () => unsub();
  }, [userId]);

  const toggleFavorite = async (partId: string) => {
    if (!userId) return;
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        const favId = `${userId}_${partId}`;
        const ref = db.collection('favorites').doc(favId);
        
        if (favorites.includes(partId)) {
          // Remove
          await ref.delete();
          setFavorites(prev => prev.filter(id => id !== partId));
        } else {
          // Add
          await ref.set({
            id: favId,
            userId,
            partId,
            createdAt: Date.now()
          });
          setFavorites(prev => [...prev, partId]);
        }
      }
    } catch (err) {
      console.warn('Toggle fav error', err);
    }
  };

  return { favorites, toggleFavorite };
}
