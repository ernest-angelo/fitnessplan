import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = async () => {
    if (loading) return;

    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('Invalid email or password.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Please confirm your email address before logging in.');
        } else {
          setErrorMessage(error.message || 'Login failed. Please try again.');
        }
        return;
      }

      if (data.session && data.user) {
        // Step 3: Fetch the user's profile
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        // Task 3: Handle missing profile safely
        if (profileError && profileError.code === 'PGRST116') {
          // No profile found. Try to create one safely.
          console.warn('Profile missing for user, attempting to create one safely:', data.user.id);
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              username: data.user.email?.split('@')[0] || `user_${Date.now()}`,
              display_name: 'New User'
            })
            .select()
            .single();
            
          if (insertError) {
            console.error('Database/profile problem: Could not create missing profile for user.', insertError);
            setErrorMessage('Login succeeded, but profile is missing and could not be created. Please contact support.');
            setLoading(false);
            return;
          }
          profile = newProfile;
          profileError = null;
        } else if (profileError) {
          console.error('Error fetching profile during login:', profileError);
          setErrorMessage('An error occurred checking your profile status.');
          setLoading(false);
          return;
        }

        // Step 4: Evaluate profile completeness
        let equipmentArr = [];
        if (profile?.equipment) {
          if (Array.isArray(profile.equipment)) {
            equipmentArr = profile.equipment;
          } else if (typeof profile.equipment === 'string') {
            try {
              equipmentArr = JSON.parse(profile.equipment);
            } catch (e) {
              if (profile.equipment.startsWith('{') && profile.equipment.endsWith('}')) {
                const content = profile.equipment.slice(1, -1);
                equipmentArr = content ? content.split(',') : [];
              } else {
                equipmentArr = [profile.equipment]; // just a string
              }
            }
          }
        }

        const isComplete = 
          profile &&
          profile.goal != null &&
          profile.experience_level != null &&
          profile.workout_days_per_week != null &&
          profile.workout_duration_min != null &&
          equipmentArr.length > 0;

        // Step 5: Route accordingly
        if (isComplete) {
          router.replace('/(app)/profile');
        } else {
          router.replace('/(auth)/onboarding');
        }
      } else {
        setErrorMessage('Unexpected login state. Please try again.');
      }
    } catch (e) {
      console.error('Unexpected login error:', e);
      setErrorMessage('An unexpected error occurred. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {!!errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

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

      <Pressable 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </Pressable>
    </View>
  );
}

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
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c4ff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});
