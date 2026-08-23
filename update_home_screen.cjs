const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/HomeScreen.tsx', 'utf8');

if (!content.includes('useFavorites')) {
  content = content.replace(
    "import { getFirebaseFirestore } from '../services/firebase';",
    "import { getFirebaseFirestore } from '../services/firebase';\nimport { useFavorites } from '../services/favorites';"
  );
  
  content = content.replace(
    "export default function HomeScreen({ navigation, user }: any) {",
    "export default function HomeScreen({ navigation, user }: any) {\n  const { favorites, toggleFavorite } = useFavorites();\n  const [firestoreBanners, setFirestoreBanners] = useState<any[]>([]);"
  );
  
  // Add fetching of banners inside useEffect
  content = content.replace(
    `    const fetchParts = async () => {`,
    `    const fetchBanners = async () => {
      try {
        const db = getFirebaseFirestore();
        if (db && typeof db.collection === 'function') {
           const docSnap = await db.collection('app_config').doc('banners').get();
           if (docSnap.exists) {
             const data = docSnap.data();
             if (data?.items && Array.isArray(data.items)) {
                setFirestoreBanners(data.items);
             }
           }
        }
      } catch(e) { console.warn('Banners fetch error', e) }
    };
    fetchBanners();
    const fetchParts = async () => {`
  );

  // Use firestoreBanners if available
  content = content.replace(
    `          <Image source={{ uri: currentBanner.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200' }} style={styles.bannerImage} />`,
    `          {currentBanner.imageUrl ? (
            <Image source={{ uri: currentBanner.imageUrl }} style={styles.bannerImage} />
          ) : (
            <View style={[styles.bannerImage, { backgroundColor: currentBanner.color || '#0F172A', justifyContent: 'center', alignItems: 'center' }]}>
               <Text style={{color:'#fff', fontWeight: 'bold'}}>{currentBanner.title}</Text>
            </View>
          )}`
  );

  content = content.replace(
    `const currentBanner = banners[activeBannerIndex];`,
    `const displayBanners = firestoreBanners.length > 0 ? firestoreBanners : banners;
  const currentBanner = displayBanners[activeBannerIndex] || banners[0];`
  );

  // Make the heart icon on parts items
  content = content.replace(
    `                <Text variant="titleMedium" numberOfLines={2} style={styles.partTitle}>{item.title}</Text>`,
    `                <Text variant="titleMedium" numberOfLines={2} style={styles.partTitle}>{item.title}</Text>
                <TouchableOpacity 
                   style={{position: 'absolute', top: -30, right: 8, backgroundColor: 'rgba(255,255,255,0.8)', padding: 4, borderRadius: 12}} 
                   onPress={() => toggleFavorite(item.id)}>
                  <IconButton icon={favorites.includes(item.id) ? "heart" : "heart-outline"} iconColor={favorites.includes(item.id) ? "#EF4444" : "#64748B"} size={20} style={{margin:0}} />
                </TouchableOpacity>`
  );

  fs.writeFileSync('react-native-app/src/screens/HomeScreen.tsx', content);
}
