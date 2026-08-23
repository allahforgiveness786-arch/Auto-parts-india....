const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/ChatRoomScreen.tsx', 'utf8');

content = content.replace(
  "const [inputText, setInputText] = useState('');",
  "const [inputText, setInputText] = useState('');\n  const [isUploading, setIsUploading] = useState(false);"
);

content = content.replace(/handleSimulateImageUpload/g, 'handlePickImage');

fs.writeFileSync('react-native-app/src/screens/ChatRoomScreen.tsx', content);
