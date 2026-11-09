import AppButton from '@/components/AppButton';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Semua autentikasi database sudah dihilangkan
  const handleLogin = async () => {
    if (loading) return;
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Email and password are required.');
      return;
    }

    if (!email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setLoading(true);


    try {
      // Skip autentikasi Supabase
      await new Promise(resolve => setTimeout(resolve, 500));

      // Routing langsung ke tabs
      router.replace('/(tabs)');

    } catch (e) {
      console.error('Navigation error:', e);
      setErrorMessage('Sistem Error');
    } finally {
      setLoading(false);
    }
  };

  // UI Login
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {!!errorMessage && (
        <Text style={styles.error}>{errorMessage}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <AppButton
        title="Login"
        onPress={handleLogin}
        loading={loading}
      />
    </View>
  );
}

// Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});
