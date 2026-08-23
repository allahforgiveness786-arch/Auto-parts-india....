const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/HomeScreen.tsx', 'utf8');

content = content.replace(
  "{categories.map((c) => (",
  "{displayCategories.map((c) => ("
);

content = content.replace(
  "key={c}",
  "key={c.id}"
);

content = content.replace(
  "selected={selectedCategory === c}",
  "selected={selectedCategory === c.id}"
);

content = content.replace(
  "onPress={() => setSelectedCategory(c)}",
  "onPress={() => setSelectedCategory(c.id)}"
);

content = content.replace(
  "{c}",
  "{c.name}"
);

fs.writeFileSync('react-native-app/src/screens/HomeScreen.tsx', content);
