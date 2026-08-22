import React, { useState } from 'react';
import { TextInput, Button, Text } from 'react-native-paper';
import BrandLogo from '../components/BrandLogo';

export default function AuthScreen({ navigation }: any) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        if (!name.trim()) {
          Alert.alert('Required', 'Please enter your full name');
          setLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        try {
          await firestore().collection('users').doc(userCred.user.uid).set({
            id: userCred.user.uid,
            email: email.trim(),
            name: name.trim(),
            phone: phone.trim(),
            createdAt: Date.now()
          });
        } catch (dbErr) {
          console.warn('[AuthScreen] Firestore user profile sync error:', dbErr);
        }
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      }
    } catch (err: any) {
      const msg = err?.message?.includes('auth/') 
        ? err.message.split('auth/')[1]?.replace(/-/g, ' ') 
        : err.message || 'Authentication failed';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0B1220" />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBox}>
          <BrandLogo size={80} style={styles.logo} />
          <Text variant="headlineSmall" style={styles.brandTitle}>
            AUTO PARTS <Text style={styles.accentText}>INDIA</Text>
          </Text>
          <Text variant="bodySmall" style={styles.brandSub}>
            Automotive Spare Parts Marketplace
          </Text>
        </View>

        <View style={styles.card}>
          <Text variant="titleLarge" style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {isLogin ? 'Sign in to access chats, sell parts & orders' : 'Join India\'s premier spare parts community'}
          </Text>

          {!isLogin && (
            <>
              <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                style={styles.input}
                outlineColor="#CBD5E1"
                activeOutlineColor="#1565FF"
              />
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                mode="outlined"
                style={styles.input}
                outlineColor="#CBD5E1"
                activeOutlineColor="#1565FF"
              />
            </>
          )}

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
            outlineColor="#CBD5E1"
            activeOutlineColor="#1565FF"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
            outlineColor="#CBD5E1"
            activeOutlineColor="#1565FF"
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#1565FF"
            textColor="#FFFFFF"
          >
            {isLogin ? 'Sign In' : 'Register Account'}
          </Button>

          <Button
            mode="text"
            onPress={() => setIsLogin(!isLogin)}
            style={styles.switchButton}
            textColor="#1565FF"
          >
            {isLogin ? "New user? Create an Account" : "Already have an account? Sign In"}
          </Button>

          <View style={styles.dividerBox}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.skipBtn} 
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipBtnText}>Explore Marketplace as Guest</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 12,
  },
  logo: {
    marginBottom: 12,
  },
  brandTitle: {
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  accentText: {
    color: '#38BDF8',
  },
  brandSub: {
    color: '#94A3B8',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#0B1220',
    marginBottom: 4,
  },
  subtitle: {
    color: '#64748B',
    marginBottom: 20,
    fontSize: 14,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  switchButton: {
    marginTop: 8,
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  skipBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
});
