const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/HomeScreen.tsx', 'utf8');

if (!content.includes('taxonomyBanners')) {
  content = content.replace(
    "const [firestoreBanners, setFirestoreBanners] = useState<any[]>([]);",
    "const [firestoreBanners, setFirestoreBanners] = useState<any[]>([]);\n  const [taxonomyCategories, setTaxonomyCategories] = useState<string[]>([]);\n  const [taxonomyBrands, setTaxonomyBrands] = useState<string[]>([]);"
  );
  
  content = content.replace(
    `    const fetchBanners = async () => {`,
    `    const fetchTaxonomy = async () => {
      try {
        const db = getFirebaseFirestore();
        if (db && typeof db.collection === 'function') {
           const docSnap = await db.collection('taxonomy').doc('data').get();
           if (docSnap.exists) {
             const data = docSnap.data();
             if (data?.categories) setTaxonomyCategories(data.categories);
             if (data?.brands) setTaxonomyBrands(data.brands.map((b:any) => b.name));
           }
        }
      } catch(e) {}
    };
    fetchTaxonomy();
    const fetchBanners = async () => {`
  );

  content = content.replace(
    `  const categoryData = [`,
    `  const displayCategories = taxonomyCategories.length > 0 
    ? ['All', ...taxonomyCategories].map(cat => ({ id: cat, name: cat, icon: 'tag-outline', count: parts.filter(p => p.category === cat).length, color: '#1565FF', bg: '#EFF6FF' })) 
    : [\n`
  );
  
  content = content.replace(
    `  const topBrands = [`,
    `  const displayBrands = taxonomyBrands.length > 0
    ? ['All', ...taxonomyBrands].map(b => ({ name: b, icon: 'car-side' }))
    : [\n`
  );

  // Replace usage of categoryData and topBrands
  content = content.replace(/categoryData/g, "displayCategories");
  content = content.replace(/topBrands/g, "displayBrands");

  fs.writeFileSync('react-native-app/src/screens/HomeScreen.tsx', content);
}
