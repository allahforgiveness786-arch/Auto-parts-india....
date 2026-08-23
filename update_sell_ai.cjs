const fs = require('fs');
let content = fs.readFileSync('react-native-app/src/screens/SellPartScreen.tsx', 'utf8');

if (!content.includes('/api/ai/autofill-listing')) {
  const realAiCode = `  const handleAutoFillAI = async () => {
    setIsAutoFilling(true);
    try {
      const payload = {
        description: description,
        category: selectedCategory !== 'Select Category' ? selectedCategory : '',
        carBrand: selectedBrand !== 'Select Brand' ? selectedBrand : '',
        carModel: selectedModel,
        price: price,
        image: images.length > 0 ? images[0] : ''
      };
      
      const baseUrl = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000';
      const response = await fetch(baseUrl + '/api/ai/autofill-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to auto-fill');
      
      const data = await response.json();
      
      if (data.title) setTitle(data.title);
      if (data.carBrand) setSelectedBrand(data.carBrand);
      if (data.carModel) setSelectedModel(data.carModel);
      if (data.partName && !title) setTitle(data.partName);
      if (data.category && data.category !== "Unknown") setSelectedCategory(data.category);
      if (data.estimatedPrice && !price) setPrice(data.estimatedPrice.toString());
      if (data.condition) setCondition(data.condition);
      
      Alert.alert('AI Auto-Fill Success', '✨ AI analyzed the part and auto-filled details successfully!');
    } catch (err) {
      console.warn('AI Autofill Error', err);
      Alert.alert('AI Autofill Failed', 'Could not extract details. Please fill manually.');
    } finally {
      setIsAutoFilling(false);
    }
  };`;

  content = content.replace(
    /const handleAutoFillAI = \(\) => {[\s\S]*?setIsAutoFilling\(false\);\n    }, 2000\);\n  };/,
    realAiCode
  );

  fs.writeFileSync('react-native-app/src/screens/SellPartScreen.tsx', content);
}
