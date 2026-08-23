const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/ChatRoomScreen.tsx', 'utf8');

if (!content.includes('promptImageSourceDialog')) {
  content = content.replace(
    "import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';",
    "import { getFirebaseFirestore, getCurrentUser } from '../services/firebase';\nimport { promptImageSourceDialog } from '../services/imagePickerService';\nimport { uploadImageToCloudinary } from '../services/cloudinary';"
  );

  content = content.replace(
    "const [text, setText] = useState('');",
    "const [text, setText] = useState('');\n  const [isUploading, setIsUploading] = useState(false);"
  );

  const realUploadCode = `  const handlePickImage = async () => {
    try {
      const selectedUri = await promptImageSourceDialog('Upload Image', 'Choose an image to send');
      if (selectedUri) {
        setIsUploading(true);
        try {
          const cloudinaryUrl = await uploadImageToCloudinary(selectedUri, 'chat_images');
          await sendMessage('', cloudinaryUrl);
        } catch (err) {
          console.warn('Chat image upload error', err);
          Alert.alert('Error', 'Failed to upload image');
        } finally {
          setIsUploading(false);
        }
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };`;

  content = content.replace(
    /const handleSimulateImageUpload = \(\) => {[\s\S]*?sendMessage\('', dummyImageUrl\);\n  };/,
    realUploadCode
  );

  content = content.replace(
    /<IconButton icon="camera" size={24} iconColor="#64748B" onPress={handleSimulateImageUpload} \/>/g,
    `<IconButton icon="camera" size={24} iconColor="#64748B" onPress={handlePickImage} disabled={isUploading} />`
  );
  content = content.replace(
    /<IconButton icon="image" size={24} iconColor="#64748B" onPress={handleSimulateImageUpload} style={{ marginLeft: -8 }} \/>/g,
    `<IconButton icon="image" size={24} iconColor="#64748B" onPress={handlePickImage} style={{ marginLeft: -8 }} disabled={isUploading} />`
  );
  
  // Add loading indicator next to input
  content = content.replace(
    `<IconButton icon="send" size={24} iconColor="#1565FF" onPress={handleSend} disabled={!text.trim()} />`,
    `{isUploading ? <ActivityIndicator size="small" color="#1565FF" style={{marginHorizontal: 12}} /> : <IconButton icon="send" size={24} iconColor="#1565FF" onPress={handleSend} disabled={!text.trim()} />}`
  );

  fs.writeFileSync('react-native-app/src/screens/ChatRoomScreen.tsx', content);
}
