const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/ProfileScreen.tsx', 'utf8');

const targetStr = `  // 2. Fetch User's Listings & Saved Parts
  useEffect(() => {
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        const unsub = db.collection('spareParts').onSnapshot((snapshot: any) => {
          const list: any[] = [];
          snapshot.forEach((doc: any) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          
          // User's own listings
          const own = list.filter((it: any) => it.sellerId === activeUid || it.userId === activeUid);
          setMyListings(own.length > 0 ? own : INITIAL_SPARE_PARTS.slice(0, 2));

          // Mock/demo saved parts
          setSavedParts(INITIAL_SPARE_PARTS.slice(2, 5));
        }, () => {
          setMyListings(INITIAL_SPARE_PARTS.slice(0, 2));
          setSavedParts(INITIAL_SPARE_PARTS.slice(2, 5));
        });

        return () => unsub?.();
      }
    } catch (_) {
      setMyListings(INITIAL_SPARE_PARTS.slice(0, 2));
      setSavedParts(INITIAL_SPARE_PARTS.slice(2, 5));
    }
  }, [activeUid]);`;

const replacement = `  // 2. Fetch User's Listings & Saved Parts
  useEffect(() => {
    let unsubParts = () => {};
    let unsubFavs = () => {};
    try {
      const db = getFirebaseFirestore();
      if (db && typeof db.collection === 'function') {
        let currentFavs: string[] = [];
        if (activeUid) {
           unsubFavs = db.collection('favorites').where('userId', '==', activeUid).onSnapshot((favSnap: any) => {
              const favIds: string[] = [];
              favSnap.forEach((doc: any) => favIds.push(doc.data().partId));
              currentFavs = favIds;
              
              setSavedParts((prev: any) => prev.filter((p: any) => favIds.includes(p.id)));
           });
        }

        unsubParts = db.collection('spareParts').onSnapshot((snapshot: any) => {
          const list: any[] = [];
          snapshot.forEach((doc: any) => {
            list.push({ id: doc.id, ...doc.data() });
          });
          
          const own = list.filter((it: any) => it.sellerId === activeUid || it.userId === activeUid);
          setMyListings(own);

          const saved = list.filter((it: any) => currentFavs.includes(it.id));
          setSavedParts(saved);
        });

        return () => {
          unsubParts();
          if (unsubFavs) unsubFavs();
        };
      }
    } catch (_) {
      setMyListings([]);
      setSavedParts([]);
    }
  }, [activeUid]);`;

content = content.replace(targetStr, replacement);
fs.writeFileSync('react-native-app/src/screens/ProfileScreen.tsx', content);
