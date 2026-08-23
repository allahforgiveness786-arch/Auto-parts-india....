const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/SellerProfileScreen.tsx', 'utf8');

if (!content.includes('sellerReviews')) {
  content = content.replace(
    "const [activeListings, setActiveListings] = useState<any[]>([]);",
    "const [activeListings, setActiveListings] = useState<any[]>([]);\n  const [reviews, setReviews] = useState<any[]>([]);"
  );
  
  content = content.replace(
    "const [followersSnap, followingSnap] = await Promise.all([",
    "const reviewsQ = db.collection('sellerReviews').where('sellerId', '==', sellerId);\n        const [followersSnap, followingSnap, reviewsSnap] = await Promise.all(["
  );
  
  content = content.replace(
    "followersQ.get(),\n          followingQ.get()",
    "followersQ.get(),\n          followingQ.get(),\n          reviewsQ.get()"
  );
  
  content = content.replace(
    "setActiveListings(items.filter((it: any) => !it.sold));",
    "setActiveListings(items.filter((it: any) => !it.sold));\n          const revs: any[] = [];\n          if (reviewsSnap) {\n            reviewsSnap.forEach((d: any) => revs.push({id: d.id, ...d.data()}));\n          }\n          setReviews(revs);"
  );

  content = content.replace(
    "{/* 4. Seller Active Listings */}",
    `{/* 4. Seller Reviews Section */}
        {reviews.length > 0 && (
          <View style={{marginTop: 24}}>
            <Text style={[styles.sectionTitle, {marginBottom: 12}]}>Seller Reviews ({reviews.length})</Text>
            {reviews.map((r, i) => (
              <View key={r.id || i} style={styles.reviewCard}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={{fontWeight: 'bold', color: '#0F172A'}}>{r.buyerName || 'Verified Buyer'}</Text>
                  <Text style={{color: '#F59E0B', fontWeight: 'bold'}}>⭐ {r.rating}/5</Text>
                </View>
                {r.partTitle ? <Text style={{fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 4}}>Purchased: {r.partTitle}</Text> : null}
                <Text style={{color: '#334155', marginTop: 4}}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}
        
        {/* 5. Seller Active Listings */}`
  );

  content += `\n  reviewCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },`;

  fs.writeFileSync('react-native-app/src/screens/SellerProfileScreen.tsx', content);
}
