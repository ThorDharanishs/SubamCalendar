import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen(): JSX.Element {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  const handleLogin = () => {
    // Basic validation for demonstration
    if (username && password) {
      // In a real app, you would verify credentials here
      // For now, we'll just navigate to the main app
      router.replace('/(app)'); // Navigate to the main app group
    } else {
      alert('Please enter a username and password.');
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient colors={['#a5c4ff', '#fcb69f']} style={styles.gradientBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <KeyboardAvoidingView 
          style={{ flex: 1, justifyContent: 'center' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.container}>
            <View style={styles.header}>
              <Image source={require('../../assets/desk-calendar.png')} style={styles.logo} />
              <Text style={styles.title}>SUBAM CALENDARS</Text>
              <Text style={styles.subtitle}>KANGEYAM</Text>
              <Text style={styles.tagline}>Crafting Your Perfect Calendar</Text>
            </View>

            <View style={styles.loginBox}>
              <Text style={styles.loginTitle}>LOGIN</Text>
              <View style={styles.inputContainer}>
                <Feather name="user" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
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
                />
              </View>
              <TouchableOpacity style={styles.buttonShadow} activeOpacity={0.8} onPress={handleLogin}>
                <LinearGradient
                  colors={['#d4e4ff', '#ffecd2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.button}
                >
                  <Text style={styles.buttonText}>Login</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
    gradientBackground: { flex: 1 },
    container: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    logo: {
      width: 60,
      height: 60,
      marginBottom: 15,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Poppins-Bold',
      color: '#1a253a',
    },
    subtitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Regular',
        color: '#485162',
    },
    tagline: {
      fontSize: 14,
      fontFamily: 'Poppins-Regular',
      color: '#777',
      marginTop: 5,
    },
    loginBox: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 20,
      padding: 25,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 15,
    },
    loginTitle: {
      fontFamily: 'Poppins-Bold',
      fontSize: 22,
      color: '#333',
      textAlign: 'center',
      marginBottom: 20,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f1f1f1',
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
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 10,
      borderRadius: 15,
      marginTop: 10,
    },
    button: {
      paddingVertical: 15,
      borderRadius: 15,
      alignItems: 'center',
    },
    buttonText: {
      color: '#485162',
      fontFamily: 'Poppins-Bold',
      fontSize: 18,
    },
    forgotText: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: '#485162',
      textAlign: 'center',
      marginTop: 20,
    },
});
