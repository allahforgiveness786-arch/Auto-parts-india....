const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/components/ImageGalleryModal.tsx', 'utf8');

if (!content.includes('ScrollView')) {
  content = content.replace(
    "import { View, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';",
    "import { View, Image, StyleSheet, Dimensions, TouchableOpacity, ScrollView } from 'react-native';"
  );
  fs.writeFileSync('react-native-app/src/components/ImageGalleryModal.tsx', content);
}
