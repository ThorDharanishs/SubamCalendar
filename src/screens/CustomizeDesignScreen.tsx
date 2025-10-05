import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Modal, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Import your Firestore instance

// Define a type for our dropdown options for better code safety
type OptionType = {
  sizes: string[];
  boardSizes: string[];
  slipSizes: string[];
};

export default function CustomizeDesignScreen(): JSX.Element {
  const router = useRouter();
  
  // State for fetched dropdown options
  const [options, setOptions] = useState<OptionType | null>(null);

  // State for selected values
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedBoardSize, setSelectedBoardSize] = useState<string | null>(null);
  const [selectedSlipSize, setSelectedSlipSize] = useState<string | null>(null);

  // State to manage loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage which dropdown is currently open - CORRECTED TYPE
  const [isDropdownVisible, setDropdownVisible] = useState<'size' | 'boardsize' | 'slipsize' | null>(null);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  // Fetch data from Firestore when the component mounts
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch each document from the 'customizationOptions' collection
        const sizesDoc = await getDoc(doc(db, 'customizationOptions', 'sizes'));
        const boardSizesDoc = await getDoc(doc(db, 'customizationOptions', 'boardSizes'));
        const slipSizesDoc = await getDoc(doc(db, 'customizationOptions', 'slipSizes'));

        if (!sizesDoc.exists() || !boardSizesDoc.exists() || !slipSizesDoc.exists()) {
          throw new Error("Customization options not found in the database.");
        }

        // Combine the data into a single state object
        setOptions({
          sizes: sizesDoc.data().options || [],
          boardSizes: boardSizesDoc.data().options || [],
          slipSizes: slipSizesDoc.data().options || [],
        });
      } catch (err) {
        setError("Failed to load design options. Please try again later.");
        console.error("Firebase fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // handleSelect function - CORRECTED LOGIC
  const handleSelect = (type: 'size' | 'boardsize' | 'slipsize', value: string) => {
    if (type === 'size') setSelectedSize(value);
    if (type === 'boardsize') setSelectedBoardSize(value);
    if (type === 'slipsize') setSelectedSlipSize(value);
    setDropdownVisible(null);
  };
  
  // Validation and navigation logic for the Next button
  const handleNextPress = () => {
    if (!selectedSize || !selectedBoardSize || !selectedSlipSize) {
      Alert.alert(
        "Incomplete Selection",
        "Please select a value for all options before proceeding."
      );
      return;
    }
    // If all options are selected, navigate to the next page
    router.push('/customizeDesignQuantity');
  };

  if (!fontsLoaded) {
    return null; // Render nothing while fonts are loading
  }

  // Display a loading indicator while fetching data
  if (loading) {
    return (
      <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.centered}>
        <ActivityIndicator size="large" color="#6a82fb" />
      </LinearGradient>
    );
  }

  // Display an error message if data fetching fails
  if (error) {
    return (
      <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

  // Custom Dropdown Component
  const Dropdown = ({ label, value, onOpen, options }: { label: string; value: string | null; onOpen: () => void; options: string[] }) => (
    <>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.dropdownButton} onPress={onOpen}>
        <Text style={[styles.dropdownText, !value && { color: '#999' }]}>
          {value || `Select ${label}`}
        </Text>
        <Feather name="chevron-down" size={24} color="#555" />
      </TouchableOpacity>
      <CustomModal
        visible={isDropdownVisible === label.toLowerCase().replace(' ', '')}
        onClose={() => setDropdownVisible(null)}
        options={options}
        onSelect={(selectedValue) => handleSelect(label.toLowerCase().replace(' ', '') as 'size' | 'boardsize' | 'slipsize', selectedValue)}
      />
    </>
  );

  // Custom Modal for Dropdown Options
  const CustomModal = ({ visible, onClose, options, onSelect }: { visible: boolean; onClose: () => void; options: string[]; onSelect: (value: string) => void; }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalItem} onPress={() => onSelect(item)}>
                <Text style={styles.modalItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.gradientBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <View>
            <Text style={styles.title}>Customize Design</Text>
            <Text style={styles.tagline}>Select your preferred dimensions</Text>
            
            <View style={styles.form}>
              <Dropdown label="Size" value={selectedSize} onOpen={() => setDropdownVisible('size')} options={options?.sizes || []} />
              <Dropdown label="Board Size" value={selectedBoardSize} onOpen={() => setDropdownVisible('boardsize')} options={options?.boardSizes || []} />
              <Dropdown label="Slip Size" value={selectedSlipSize} onOpen={() => setDropdownVisible('slipsize')} options={options?.slipSizes || []} />
            </View>
          </View>

          <View style={styles.navBar}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#485162" />
              <Text style={styles.navText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.navButton} onPress={handleNextPress}>
              <Text style={styles.navText}>Next</Text>
              <Feather name="arrow-right" size={24} color="#485162" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#1a253a',
    textAlign: 'center',
    marginTop: 60,
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#777',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  label: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#444',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  dropdownText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#d9534f',
    textAlign: 'center',
    padding: 20,
  },
  navBar: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e0eafc',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  navText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#485162',
    marginHorizontal: 8,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
    width: '100%',
    maxHeight: '60%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 20,
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#333',
  },
});

