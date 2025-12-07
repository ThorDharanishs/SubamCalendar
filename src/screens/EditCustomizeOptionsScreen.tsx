import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, Alert, Modal, TextInput, FlatList, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

// Define types for our data for better code safety
type OptionDocument = {
  id: string; // Document ID ('sizes', 'boardSizes', etc.)
  options: string[];
};

type QuantityDocument = {
  id: string; // Document ID ('quantities')
  list: number[];
  wrapperMap: { [key: string]: number[] };
};

// Define a more detailed type for the item being edited
type EditTarget = 
  | { type: 'option', docId: string; value?: string }
  | { type: 'quantity', value?: number }
  | { type: 'wrapper', quantity: number; value?: number };

export default function EditCustomizeOptionsScreen(): JSX.Element {
  const router = useRouter();
  
  const [options, setOptions] = useState<OptionDocument[]>([]);
  const [quantities, setQuantities] = useState<QuantityDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<EditTarget | null>(null);
  const [inputValue, setInputValue] = useState('');

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  // Fetch all documents from the collection in real-time
  useEffect(() => {
    const q = collection(db, 'customizationOptions');
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOptions: OptionDocument[] = [];
      let fetchedQuantities: QuantityDocument | null = null;
      
      querySnapshot.forEach((doc) => {
        if (doc.id === 'quantities') {
          fetchedQuantities = { id: doc.id, ...doc.data() } as QuantityDocument;
        } else {
          fetchedOptions.push({ id: doc.id, ...doc.data() } as OptionDocument);
        }
      });

      setOptions(fetchedOptions);
      setQuantities(fetchedQuantities);
      setLoading(false);
    }, (err) => {
      setError("Failed to load options from the database.");
      console.error(err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openModal = (item: EditTarget) => {
    setCurrentItem(item);
    // @ts-ignore
    setInputValue(item.value?.toString() || '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!currentItem || !inputValue.trim()) return;
    
    try {
        const batch = writeBatch(db);
        const quantitiesRef = doc(db, 'customizationOptions', 'quantities');

        switch(currentItem.type) {
            case 'option':
                const docRef = doc(db, 'customizationOptions', currentItem.docId);
                if (currentItem.value) { // Update
                    batch.update(docRef, { options: arrayRemove(currentItem.value) });
                    batch.update(docRef, { options: arrayUnion(inputValue.trim()) });
                } else { // Add
                    batch.update(docRef, { options: arrayUnion(inputValue.trim()) });
                }
                break;
            
            case 'quantity':
                const newQuantity = parseInt(inputValue.trim(), 10);
                if (isNaN(newQuantity)) return Alert.alert("Invalid Input", "Please enter a valid number for the quantity.");
                
                if (currentItem.value) { // Update - complex, requires migrating wrapper map. Simplified to delete/add.
                    Alert.alert("Not Supported", "Please delete the old quantity and add a new one.");
                    return;
                } else { // Add
                    batch.update(quantitiesRef, { 
                        list: arrayUnion(newQuantity),
                        [`wrapperMap.${newQuantity}`]: [] 
                    });
                }
                break;

            case 'wrapper':
                const newWrapper = parseInt(inputValue.trim(), 10);
                if (isNaN(newWrapper)) return Alert.alert("Invalid Input", "Please enter a valid number for the wrapper.");
                
                const fieldPath = `wrapperMap.${currentItem.quantity}`;
                if (currentItem.value) { // Update
                    batch.update(quantitiesRef, { [fieldPath]: arrayRemove(currentItem.value) });
                    batch.update(quantitiesRef, { [fieldPath]: arrayUnion(newWrapper) });
                } else { // Add
                    batch.update(quantitiesRef, { [fieldPath]: arrayUnion(newWrapper) });
                }
                break;
        }
        await batch.commit();
    } catch (err) {
      console.error("Save Error:", err);
      Alert.alert("Error", "Could not save the item.");
    } finally {
      setModalVisible(false);
    }
  };

  const handleDelete = async (item: EditTarget) => {
    Alert.alert(
      `Delete Item`,
      `Are you sure you want to delete "${item.value}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          try {
            const batch = writeBatch(db);
            const quantitiesRef = doc(db, 'customizationOptions', 'quantities');

            switch(item.type) {
                case 'option':
                    const docRef = doc(db, 'customizationOptions', item.docId);
                    batch.update(docRef, { options: arrayRemove(item.value) });
                    break;
                
                case 'quantity':
                    if (item.value) {
                       batch.update(quantitiesRef, { 
                           list: arrayRemove(item.value),
                           [`wrapperMap.${item.value}`]: undefined // Deletes the map key
                       });
                    }
                    break;

                case 'wrapper':
                    if (item.value) {
                        const fieldPath = `wrapperMap.${item.quantity}`;
                        batch.update(quantitiesRef, { [fieldPath]: arrayRemove(item.value) });
                    }
                    break;
            }
            await batch.commit();
          } catch (err) {
            console.error("Delete Error:", err);
            Alert.alert("Error", "Could not delete the item.");
          }
        }}
      ]
    );
  };

  if (!fontsLoaded || loading) {
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

  return (
    <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.gradientBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.headerContainer}>
           <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#485162" />
            </TouchableOpacity>
            <Text style={styles.title}>Edit Options</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {options.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <Text style={styles.cardTitle}>{doc.id.charAt(0).toUpperCase() + doc.id.slice(1)}</Text>
              {doc.options.sort().map((item) => (
                <View key={item} style={styles.itemRow}>
                  <Text style={styles.itemText}>{item}</Text>
                  <View style={styles.itemActions}>
                    <TouchableOpacity onPress={() => openModal({ type: 'option', docId: doc.id, value: item })}>
                      <Feather name="edit-2" size={20} color="#6a82fb" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete({ type: 'option', docId: doc.id, value: item })} style={{ marginLeft: 15 }}>
                      <Feather name="trash-2" size={20} color="#dc3545" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <TouchableOpacity style={styles.addButton} onPress={() => openModal({ type: 'option', docId: doc.id })}>
                <Feather name="plus-circle" size={20} color="#28a745" />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>
          ))}
          
          {quantities && (
             <View style={styles.card}>
                <Text style={styles.cardTitle}>Quantities & Wrappers</Text>
                {quantities.list.sort((a, b) => a - b).map(quantity => (
                    <View key={quantity} style={styles.quantitySection}>
                        <View style={styles.itemRow}>
                            <Text style={styles.quantityTitle}>{quantity}</Text>
                            <TouchableOpacity onPress={() => handleDelete({ type: 'quantity', value: quantity })}>
                                <Feather name="trash-2" size={20} color="#dc3545" />
                            </TouchableOpacity>
                        </View>
                        {quantities.wrapperMap[quantity]?.sort((a,b) => a-b).map(wrapper => (
                            <View key={wrapper} style={styles.subItemRow}>
                                <Text style={styles.itemText}>{wrapper}</Text>
                                <View style={styles.itemActions}>
                                    <TouchableOpacity onPress={() => openModal({ type: 'wrapper', quantity, value: wrapper })}>
                                        <Feather name="edit-2" size={20} color="#6a82fb" />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete({ type: 'wrapper', quantity, value: wrapper })} style={{ marginLeft: 15 }}>
                                        <Feather name="trash-2" size={20} color="#dc3545" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                        <TouchableOpacity style={styles.addSubButton} onPress={() => openModal({ type: 'wrapper', quantity })}>
                            <Feather name="plus" size={18} color="#6a82fb" />
                            <Text style={styles.addSubButtonText}>Add Wrapper</Text>
                        </TouchableOpacity>
                    </View>
                ))}
                 <TouchableOpacity style={styles.addButton} onPress={() => openModal({ type: 'quantity' })}>
                    <Feather name="plus-circle" size={20} color="#28a745" />
                    <Text style={styles.addButtonText}>Add New Quantity</Text>
                </TouchableOpacity>
             </View>
          )}
        </ScrollView>

        <Modal visible={modalVisible} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{currentItem?.value ? `Edit ${currentItem.type}` : `Add New ${currentItem?.type}`}</Text>
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Enter value"
                autoFocus
                keyboardType={currentItem?.type === 'option' ? 'default' : 'numeric'}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 20 },
  title: { fontSize: 28, fontFamily: 'Poppins-Bold', color: '#1a253a', marginLeft: 10 },
  scrollContainer: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, },
  cardTitle: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#1a253a', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', },
  itemText: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#333' },
  itemActions: { flexDirection: 'row' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 15, marginTop: 5 },
  addButtonText: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#28a745', marginLeft: 8 },
  errorText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#d9534f', textAlign: 'center', padding: 20, },
  navButton: { flexDirection: 'row', alignItems: 'center', padding: 10, },
  navText: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#485162', marginLeft: 8 },
  quantitySection: {
    marginBottom: 15,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e0eafc'
  },
  quantityTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#485162'
  },
  subItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginLeft: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  addSubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    marginLeft: 15,
  },
  addSubButtonText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#6a82fb',
    marginLeft: 8,
  },
  // Modal Styles
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 25 },
  modalTitle: { fontSize: 22, fontFamily: 'Poppins-Bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: '#f8f9fa', borderRadius: 10, padding: 15, fontSize: 16, fontFamily: 'Poppins-Regular', borderWidth: 1, borderColor: '#eee' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 10, backgroundColor: '#6c757d' },
  saveButton: { backgroundColor: '#6a82fb' },
  modalButtonText: { color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 16, textAlign: 'center' },
});

