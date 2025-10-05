import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Import Firebase auth functions
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig'; // Import your Firebase config

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  // State for email and password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  // --- Firebase Login Logic ---
  const handleLogin = async () => {
    // Prevent multiple clicks while loading
    if (loading) return;

    // Basic validation
    if (!email.trim() || !password.trim()) {
      Alert.alert("Login Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // Use the Firebase function to sign in
      await signInWithEmailAndPassword(auth, email, password);
      // On success, Firebase handles the session. Redirect to the main app.
      // `replace` is used to prevent the user from going back to the login screen.
      router.replace('/(app)'); 
    } catch (error: any) {
      // Handle Firebase errors (e.g., wrong password, user not found)
      let errorMessage = "An unknown error occurred. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <LinearGradient colors={['#a5c4ff', '#fcb69f']} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
          <Image source={require('../../assets/desk-calendar.png')} style={styles.logo} />
          <Text style={styles.title}>SUBAM CALENDARS</Text>
          <Text style={styles.tagline}>Crafting Your Perfect Calendar</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.loginTitle}>LOGIN</Text>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>
          <View style={styles.inputContainer}>
            <Feather name="lock" size={20} color="#999" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#999"
              secureTextEntry
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={styles.buttonShadow} activeOpacity={0.8} onPress={handleLogin} disabled={loading}>
            <LinearGradient
              colors={['#6a82fb', '#4facfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#1a253a',
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: '#444',
  },
  formContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  loginTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
    paddingVertical: 15,
    paddingRight: 15,
  },
  buttonShadow: {
    shadowColor: '#4facfe',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
    borderRadius: 30,
    marginTop: 10,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Ensure button height is consistent with loader
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
  forgotText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
  },
});

