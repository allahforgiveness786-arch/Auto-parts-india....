const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/ProductDetailScreen.tsx', 'utf8');

if (!content.includes('useFavorites')) {
  content = content.replace(
    "import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';",
    "import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';\nimport { useFavorites } from '../services/favorites';"
  );

  content = content.replace(
    "const user = initialUser || getCurrentUser();",
    "const user = initialUser || getCurrentUser();\n  const { favorites, toggleFavorite } = useFavorites();\n  const isFav = favorites.includes(part?.id);"
  );

  content = content.replace(
    `        <TouchableOpacity style={styles.shareFab} onPress={handleShare}>`,
    `        <TouchableOpacity style={styles.favFab} onPress={() => toggleFavorite(part.id)}>
          <IconButton icon={isFav ? "heart" : "heart-outline"} iconColor={isFav ? "#EF4444" : "#0B1220"} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareFab} onPress={handleShare}>`
  );

  content = content.replace(
    `  shareFab: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 4,
  },`,
    `  shareFab: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 4,
  },
  favFab: {
    position: 'absolute',
    top: 16,
    right: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 4,
  },`
  );

  fs.writeFileSync('react-native-app/src/screens/ProductDetailScreen.tsx', content);
}
