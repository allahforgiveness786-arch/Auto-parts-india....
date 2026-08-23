const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/SellerProfileScreen.tsx', 'utf8');
content = content.replace(
  `});

  reviewCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },`,
  `  reviewCard: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
});`
);
fs.writeFileSync('react-native-app/src/screens/SellerProfileScreen.tsx', content);
