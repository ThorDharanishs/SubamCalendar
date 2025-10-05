import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useOrder } from '../context/OrderContext'; // CORRECTED PATH
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';

export default function OrderSummaryScreen(): JSX.Element {
  const router = useRouter();
  const { orderDetails, resetOrder } = useOrder();
  
  const [transportNeeded, setTransportNeeded] = useState(false);
  const [transportFee, setTransportFee] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  // Perform price calculations
  const { calendarPrice, gstAmount, totalAmount } = useMemo(() => {
    const quantity = orderDetails.quantity || 0;
    const wrapper = orderDetails.wrapper || 0;
    const fee = parseFloat(transportFee) || 0;
    const gst = parseFloat(gstPercent) || 0;

    const calendarPrice = quantity * wrapper;
    const subtotal = calendarPrice + (transportNeeded ? fee : 0);
    const gstAmount = subtotal * (gst / 100);
    const totalAmount = subtotal + gstAmount;
    
    return { calendarPrice, gstAmount, totalAmount };
  }, [orderDetails, transportNeeded, transportFee, gstPercent]);

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    try {
      const orderData = {
        ...orderDetails,
        bookingDate: serverTimestamp(),
        userId: auth.currentUser?.uid,
        costs: {
          calendarPrice,
          transportNeeded,
          transportFee: transportNeeded ? (parseFloat(transportFee) || 0) : 0,
          gstPercent: parseFloat(gstPercent) || 0,
          gstAmount,
          totalAmount,
        },
        status: 'Pending',
      };

      // Add a new document with a generated ID
      await addDoc(collection(db, "orders"), orderData);

      Alert.alert("Success", "Your order has been placed successfully!");
      resetOrder(); // Clear the order context
      router.replace('/(app)'); // Navigate back to home
      
    } catch (error) {
      console.error("Error placing order: ", error);
      Alert.alert("Error", "Could not place your order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (!fontsLoaded) return null;

  const SummaryItem = ({ label, value }: { label: string; value?: string | number }) => (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value || 'N/A'}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.gradientBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.container}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <Text style={styles.title}>Order Summary</Text>
            <Text style={styles.tagline}>Please review your order details</Text>
            
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Customer Details</Text>
              <SummaryItem label="Name" value={orderDetails.customerName} />
              <SummaryItem label="Phone" value={orderDetails.customerPhone} />
              <SummaryItem label="Address" value={orderDetails.customerAddress} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Design Details</Text>
              <SummaryItem label="Design Type" value={orderDetails.designType} />
              <SummaryItem label="Size" value={orderDetails.size} />
              <SummaryItem label="Board Size" value={orderDetails.boardSize} />
              <SummaryItem label="Slip Size" value={orderDetails.slipSize} />
              <SummaryItem label="Quantity" value={orderDetails.quantity} />
              <SummaryItem label="Wrapper" value={orderDetails.wrapper} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Price Calculation</Text>
              <SummaryItem label="Calendar Price" value={`₹ ${calendarPrice.toFixed(2)}`} />

              <View style={styles.transportContainer}>
                <Text style={styles.summaryLabel}>Transport Needed?</Text>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity 
                    style={[styles.toggleButton, transportNeeded && styles.toggleButtonActive]}
                    onPress={() => setTransportNeeded(true)}
                  >
                    <Text style={[styles.toggleButtonText, transportNeeded && styles.toggleButtonTextActive]}>Yes</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.toggleButton, !transportNeeded && styles.toggleButtonActive]}
                    onPress={() => setTransportNeeded(false)}
                  >
                    <Text style={[styles.toggleButtonText, !transportNeeded && styles.toggleButtonTextActive]}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {transportNeeded && (
                <View style={styles.inputContainer}>
                  <Feather name="truck" size={20} color="#999" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Transport Fee"
                    value={transportFee}
                    onChangeText={setTransportFee}
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              )}

              <View style={styles.inputContainer}>
                <Feather name="percent" size={20} color="#999" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="GST %"
                  value={gstPercent}
                  onChangeText={setGstPercent}
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                />
              </View>

              <SummaryItem label="GST Amount" value={`₹ ${gstAmount.toFixed(2)}`} />
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>Total Amount</Text>
                <Text style={styles.totalValue}>₹ {totalAmount.toFixed(2)}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.buttonShadow} 
              onPress={handlePlaceOrder}
              disabled={isPlacingOrder}
            >
              <LinearGradient
                colors={['#28a745', '#218838']}
                style={styles.button}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="check-circle" size={22} color="#fff" />
                    <Text style={styles.buttonText}>Place Order</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>

          <View style={styles.navBar}>
            <TouchableOpacity style={styles.navButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#485162" />
              <Text style={styles.navText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// Styles are extensive, so they are provided below
const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#1a253a',
    textAlign: 'center',
    marginTop: 20, // Reduced margin
  },
  tagline: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
    color: '#777',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
    marginHorizontal: 10,
  },
  cardTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#1a253a',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 16,
    color: '#1a253a',
  },
  transportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    marginLeft: 10,
  },
  toggleButtonActive: {
    backgroundColor: '#6a82fb',
    borderColor: '#6a82fb',
  },
  toggleButtonText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#555',
  },
  toggleButtonTextActive: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    marginTop: 15,
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
    paddingVertical: 12,
    paddingRight: 15,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1a253a',
  },
  totalValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#28a745',
  },
  buttonShadow: {
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: 30,
    marginHorizontal: 10,
    marginTop: 10,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    marginLeft: 10,
  },
  navBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Only show back button
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0eafc',
    paddingHorizontal: 20,
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
});

