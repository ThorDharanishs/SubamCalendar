import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Image, StatusBar } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from "expo-router"; // Import the router hook

export default function HomeScreen(): JSX.Element {
  const router = useRouter(); // Initialize the router

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <LinearGradient
      // Use the same beautiful gradient as the login screen
      colors={['#a5c4ff', '#fcb69f']} 
      style={styles.gradientBackground}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        <View style={styles.header}>
          <Text style={styles.title}>SUBAM CALENDARS</Text>
          <Text style={styles.subtitle}>KANGEYAM</Text>
          <Text style={styles.tagline}>Crafting Your Perfect Calendar</Text>
        </View>

        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={require("../../assets/desk-calendar.png")}
          />
        </View>

        <View style={styles.actionArea}>
          <Text style={styles.contact}>Contact: +91 98765 43210</Text>
          <TouchableOpacity
            style={styles.buttonShadow}
            // This line tells the app to go to the '/details' page when pressed
            onPress={() => router.push('/(app)/details')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6a82fb', '#4facfe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Start Your Order</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Styles remain the same
const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    marginTop:30,
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#1a253a',
    textAlign: 'center',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Regular',
    color: '#485162',
    marginTop: 4,
  },
  tagline: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: "#777",
    marginTop: 8,
  },
  imageContainer: {
    width: 280,
    height: 280,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 18,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  actionArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  contact: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: "#444",
    marginBottom: 20,
  },
  buttonShadow: {
    shadowColor: "#4facfe",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 12,
    borderRadius: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#fff",
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
  },
});

