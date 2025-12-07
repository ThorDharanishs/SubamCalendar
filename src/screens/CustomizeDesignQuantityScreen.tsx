import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Modal, FlatList, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useOrder } from '../context/OrderContext';

type QuantityOptions = {
  list: number[];
  wrapperMap: { [key: string]: number[] }; // Keys in Firestore maps are strings
};

export default function CustomizeDesignQuantityScreen(): JSX.Element {
  const router = useRouter();
  const { updateOrderDetails } = useOrder();
  
  const [options, setOptions] = useState<QuantityOptions | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [selectedWrapper, setSelectedWrapper] = useState<number | null>(null);
  const [wrapperOptions, setWrapperOptions] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownVisible, setDropdownVisible] = useState<'quantity' | 'wrapper' | null>(null);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const quantityDoc = await getDoc(doc(db, 'customizationOptions', 'quantities'));
        if (!quantityDoc.exists()) {
          throw new Error("Quantity options not found in the database.");
        }
        setOptions(quantityDoc.data() as QuantityOptions);
      } catch (err) {
        setError("Failed to load quantity options.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  // Effect to update wrapper options when quantity changes
  useEffect(() => {
    if (selectedQuantity && options) {
      // Use string key to access map property
      setWrapperOptions(options.wrapperMap[String(selectedQuantity)] || []);
      setSelectedWrapper(null); // Reset wrapper selection
    } else {
      setWrapperOptions([]);
    }
  }, [selectedQuantity, options]);

  const handleSelect = (type: 'quantity' | 'wrapper', value: number) => {
    if (type === 'quantity') setSelectedQuantity(value);
    if (type === 'wrapper') setSelectedWrapper(value);
    setDropdownVisible(null);
  };

  const handleNextPress = () => {
    if (!selectedQuantity || !selectedWrapper) {
      Alert.alert(
        "Incomplete Selection",
        "Please select both a quantity and a wrapper to continue."
      );
      return;
    }
    // Save data to context before navigating
    updateOrderDetails({
      quantity: selectedQuantity,
      wrapper: selectedWrapper,
    });
    router.push('/orderSummary');
  };

  if (!fontsLoaded) return null;

  if (loading) {
    return (
      <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.centered}>
        <ActivityIndicator size="large" color="#6a82fb" />
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </LinearGradient>
    );
  }

  const Dropdown = ({ type, label, value, onOpen, options, disabled = false }: { type: 'quantity' | 'wrapper', label: string; value: number | null; onOpen: () => void; options: number[]; disabled?: boolean }) => (
    <>
      <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
      <TouchableOpacity style={[styles.dropdownButton, disabled && styles.disabledButton]} onPress={onOpen} disabled={disabled}>
        <Text style={[styles.dropdownText, !value && { color: '#999' }]}>
          {value !== null ? value : `Select ${label}`}
        </Text>
        <Feather name="chevron-down" size={24} color={disabled ? '#ccc' : '#555'} />
      </TouchableOpacity>
      {!disabled && (
        <CustomModal
          visible={isDropdownVisible === type}
          onClose={() => setDropdownVisible(null)}
          options={options}
          onSelect={(selectedValue) => handleSelect(type, selectedValue)}
        />
      )}
    </>
  );

  const CustomModal = ({ visible, onClose, options, onSelect }: { visible: boolean; onClose: () => void; options: number[]; onSelect: (value: number) => void; }) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <View style={styles.modalContent}>
          <FlatList
            data={options}
            keyExtractor={(item) => item.toString()}
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
            <Text style={styles.title}>Choose Quantity</Text>
            <Text style={styles.tagline}>Select your order quantity and wrapper</Text>
            
            <View style={styles.form}>
              <Dropdown type="quantity" label="Quantity" value={selectedQuantity} onOpen={() => setDropdownVisible('quantity')} options={options?.list || []} />
              <Dropdown type="wrapper" label="Customize Wrapper" value={selectedWrapper} onOpen={() => setDropdownVisible('wrapper')} options={wrapperOptions} disabled={!selectedQuantity} />
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
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  disabledText: {
    color: '#aaa',
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

