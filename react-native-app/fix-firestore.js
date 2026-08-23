const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const files = [];
walkDir(path.join(__dirname, 'src'), f => {
  if (f.endsWith('.ts') || f.endsWith('.tsx')) {
    files.push(f);
  }
});
files.push(path.join(__dirname, 'App.tsx'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Import replacement
  content = content.replace(/import\s+\{.*getFirestore.*\}\s+from\s+['"]@react-native-firebase\/firestore['"];/g, "import firestore from '@react-native-firebase/firestore';");
  content = content.replace(/import\s+\{.*\}\s+from\s+['"]@react-native-firebase\/firestore['"];/g, "import firestore from '@react-native-firebase/firestore';");

  // getFirestore() -> firestore() in case it was used directly somewhere else, but usually it's inside doc/collection
  // let's do more targeted replacements

  // serverTimestamp() -> firestore.FieldValue.serverTimestamp()
  content = content.replace(/serverTimestamp\(\)/g, "firestore.FieldValue.serverTimestamp()");

  // doc(getFirestore(), 'collection', 'id') -> firestore().collection('collection').doc('id')
  content = content.replace(/doc\(getFirestore\(\),\s*([^,]+),\s*([^,\)]+)\)/g, "firestore().collection($1).doc($2)");
  
  // doc(getFirestore(), 'col', 'id', 'subcol', 'subid') -> firestore().doc(col + '/' + id + '/' + subcol + '/' + subid)
  content = content.replace(/doc\(getFirestore\(\),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,\)]+)\)/g, "firestore().collection($1).doc($2).collection($3).doc($4)");

  // collection(getFirestore(), 'col') -> firestore().collection('col')
  content = content.replace(/collection\(getFirestore\(\),\s*([^,\)]+)\)/g, "firestore().collection($1)");

  // collection(getFirestore(), 'col', id, 'subcol') -> firestore().collection('col').doc(id).collection('subcol')
  content = content.replace(/collection\(getFirestore\(\),\s*([^,]+),\s*([^,]+),\s*([^,\)]+)\)/g, "firestore().collection($1).doc($2).collection($3)");

  // setDoc(ref, data) -> ref.set(data)
  // Need to be careful with multi-line, let's use regex for setDoc(something, { ... })
  // Actually, since setDoc is setDoc(ref, data), we can do:
  content = content.replace(/setDoc\(([^,]+),\s*(\{[\s\S]*?\})\)/g, "$1.set($2)");
  // If it's a simple variable: setDoc(ref, data)
  content = content.replace(/setDoc\(([^,]+),\s*([^\)]+)\)/g, (match, p1, p2) => {
     if (p2.trim().startsWith('{')) return match; // Handled above roughly, but to be safe:
     return `${p1}.set(${p2})`;
  });
  
  // A better approach for setDoc(ref, data) that spans multiple lines:
  // Usually ref is simple like `userRef` or `docRef`
  content = content.replace(/setDoc\(([a-zA-Z0-9_]+),\s*/g, "$1.set(");

  // updateDoc(ref, data)
  content = content.replace(/updateDoc\(([a-zA-Z0-9_]+),\s*/g, "$1.update(");

  // deleteDoc(ref)
  content = content.replace(/deleteDoc\(([a-zA-Z0-9_]+)\)/g, "$1.delete()");
  content = content.replace(/deleteDoc\(doc\(getFirestore\(\),\s*([^,]+),\s*([^,\)]+)\)\)/g, "firestore().collection($1).doc($2).delete()");

  // addDoc(ref, data)
  content = content.replace(/addDoc\(([a-zA-Z0-9_]+),\s*/g, "$1.add(");
  // addDoc(collection(getFirestore(), 'col'), { ... })
  content = content.replace(/addDoc\(firestore\(\)\.collection\(([^)]+)\),\s*/g, "firestore().collection($1).add(");

  // query(ref, where(...), orderBy(...)) -> ref.where(...).orderBy(...)
  // let's do this manually, it's easier to find query( and fix it
  
  // onSnapshot(ref, callback)
  // onSnapshot(ref, callback, errorCallback)
  content = content.replace(/onSnapshot\(([a-zA-Z0-9_]+),\s*/g, "$1.onSnapshot(");
  // onSnapshot(doc(...), callback)
  content = content.replace(/onSnapshot\(firestore\(\)\.collection\(([^)]+)\)\.doc\(([^)]+)\),\s*/g, "firestore().collection($1).doc($2).onSnapshot(");
  content = content.replace(/onSnapshot\(firestore\(\)\.collection\(([^)]+)\),\s*/g, "firestore().collection($1).onSnapshot(");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
