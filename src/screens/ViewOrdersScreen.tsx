import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebaseConfig';
import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';

// --- UPDATED Order Interface ---
interface Order {
  id: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  designType?: string;
  size?: string;
  boardSize?: string;
  slipSize?: string;
  quantity?: number;
  wrapper?: number;
  status: 'Pending' | 'Completed';
  bookingDate: Timestamp;
  costs: {
    totalAmount: number;
    calendarPrice: number;
    transportNeeded: boolean;
    transportFee: number;
    packingCharge: number; // Added packingCharge
    gstPercent: number;
    gstAmount: number;
  };
  [key: string]: any;
}

export default function ViewOrdersScreen(): JSX.Element {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'Pending' | 'Completed'>('Pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [fontsLoaded] = useFonts({
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
  });

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, "orders"), where("userId", "==", auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedOrders: Order[] = [];
      querySnapshot.forEach((doc) => {
        fetchedOrders.push({ id: doc.id, ...doc.data() } as Order);
      });
      setOrders(fetchedOrders);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching orders: ", err);
      setError("Failed to fetch orders.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { pendingOrders, completedOrders } = useMemo(() => ({
    pendingOrders: orders.filter(o => o.status === 'Pending'),
    completedOrders: orders.filter(o => o.status === 'Completed'),
  }), [orders]);

  const completedStats = useMemo(() => {
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.costs?.totalAmount || 0), 0);
    return {
      totalRevenue,
      orderCount: completedOrders.length,
    };
  }, [completedOrders]);

  const handleMarkAsCompleted = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: 'Completed' });
    } catch (err) {
      Alert.alert("Error", "Could not update the order.");
    }
  };

  const handleCancelOrder = (orderId: string, customerName?: string) => {
    Alert.alert("Cancel Order", `Are you sure you want to cancel the order for ${customerName}?`,
      [{ text: "No", style: "cancel" }, { text: "Yes, Cancel", style: "destructive", onPress: async () => {
        try { await deleteDoc(doc(db, "orders", orderId)); } catch (err) { Alert.alert("Error", "Could not cancel the order."); }
      }}]);
  };

  const handleDeleteCompleted = (orderId: string) => {
     Alert.alert("Delete Order", `This will permanently delete this completed order record. Are you sure?`,
      [{ text: "No", style: "cancel" }, { text: "Yes, Delete", style: "destructive", onPress: async () => {
        try { await deleteDoc(doc(db, "orders", orderId)); } catch (err) { Alert.alert("Error", "Could not delete the order record."); }
      }}]);
  }

  const viewSummary = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };
  
  // --- UPDATED HTML Generation for PDF ---
  const generateHtml = (order: Order) => {
    const bookingDate = order.bookingDate ? order.bookingDate.toDate().toLocaleDateString('en-IN') : 'N/A';

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; }
            .container { padding: 30px; }
            h1 { color: #1a253a; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            h2 { color: #485162; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; margin-top: 25px; }
            .item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f9f9f9; }
            .label { font-weight: bold; color: #555; }
            .value { text-align: right; }
            .total-item { display: flex; justify-content: space-between; padding: 10px 0; margin-top: 15px; border-top: 2px solid #ddd; }
            .total-label { font-weight: bold; font-size: 1.2em; }
            .total-value { font-weight: bold; font-size: 1.3em; color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Order Summary</h1>
            <div class="item"><span class="label">Booking Date:</span> <span class="value">${bookingDate}</span></div>
            
            <h2>Customer Details</h2>
            <div class="item"><span class="label">Name:</span> <span class="value">${order.customerName || 'N/A'}</span></div>
            <div class="item"><span class="label">Phone:</span> <span class="value">${order.customerPhone || 'N/A'}</span></div>
            <div class="item"><span class="label">Address:</span> <span class="value">${order.customerAddress || 'N/A'}</span></div>
            
            <h2>Design Details</h2>
            <div class="item"><span class="label">Design Type:</span> <span class="value">${order.designType || 'N/A'}</span></div>
            <div class="item"><span class="label">Size:</span> <span class="value">${order.size || 'N/A'}</span></div>
            <div class="item"><span class="label">Board Size:</span> <span class="value">${order.boardSize || 'N/A'}</span></div>
            <div class="item"><span class="label">Slip Size:</span> <span class="value">${order.slipSize || 'N/A'}</span></div>
            <div class="item"><span class="label">Quantity:</span> <span class="value">${order.quantity || 0}</span></div>
            <div class="item"><span class="label">Wrapper:</span> <span class="value">${order.wrapper || 0}</span></div>
            
            <h2>Price Calculation</h2>
            <div class="item"><span class="label">Calendar Price:</span> <span class="value">₹${order.costs.calendarPrice.toFixed(2)}</span></div>
            <div class="item"><span class="label">Packing Charge:</span> <span class="value">₹${(order.costs.packingCharge || 0).toFixed(2)}</span></div>
            <div class="item"><span class="label">Transport Fee:</span> <span class="value">₹${order.costs.transportFee.toFixed(2)}</span></div>
            <div class="item"><span class="label">GST (${order.costs.gstPercent}%):</span> <span class="value">₹${order.costs.gstAmount.toFixed(2)}</span></div>
            
            <div class="total-item">
              <span class="total-label">Total Amount:</span>
              <span class="total-value">₹${order.costs.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPdf = async () => {
    if (!selectedOrder) return;
    try {
      const html = generateHtml(selectedOrder);
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Alert.alert("Error", "Could not generate PDF.");
    }
  };

  if (!fontsLoaded) return null;

  const renderPendingItem = ({ item, index }: { item: Order, index: number }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}><Text style={styles.cardText}><Text style={styles.cardLabel}>S.No:</Text> {index + 1}</Text><Text style={styles.cardText}><Text style={styles.cardLabel}>Name:</Text> {item.customerName}</Text></View>
      <View style={styles.cardRow}><Text style={styles.cardText}><Text style={styles.cardLabel}>Phone:</Text> {item.customerPhone}</Text><Text style={styles.cardText}><Text style={styles.cardLabel}>Total:</Text> ₹{item.costs?.totalAmount.toFixed(2)}</Text></View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => viewSummary(item)}><Feather name="eye" size={24} color="#6a82fb" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonComplete} onPress={() => handleMarkAsCompleted(item.id)}><Feather name="check-circle" size={18} color="#fff" /><Text style={styles.actionButtonText}>Delivered</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionButtonCancel} onPress={() => handleCancelOrder(item.id, item.customerName)}><Feather name="x-circle" size={18} color="#fff" /><Text style={styles.actionButtonText}>Cancel</Text></TouchableOpacity>
      </View>
    </View>
  );

  const renderCompletedItem = ({ item, index }: { item: Order, index: number }) => (
     <View style={[styles.card, {backgroundColor: '#f0f4f8'}]}><View style={styles.cardRow}><Text style={styles.cardText}><Text style={styles.cardLabel}>S.No:</Text> {index + 1}</Text><Text style={styles.cardText}><Text style={styles.cardLabel}>Name:</Text> {item.customerName}</Text></View><View style={styles.cardRow}><Text style={styles.cardText}><Text style={styles.cardLabel}>Phone:</Text> {item.customerPhone}</Text><Text style={styles.cardText}><Text style={styles.cardLabel}>Total:</Text> ₹{item.costs?.totalAmount.toFixed(2)}</Text></View><View style={styles.cardActions}><TouchableOpacity onPress={() => viewSummary(item)}><Feather name="eye" size={24} color="#6a82fb" /></TouchableOpacity><TouchableOpacity onPress={() => handleDeleteCompleted(item.id)}><Feather name="trash-2" size={24} color="#dc3545" /></TouchableOpacity></View></View>
  );

  // --- UPDATED Summary Modal ---
  const SummaryModal = () => {
    if (!selectedOrder) return null;
    const bookingDate = selectedOrder.bookingDate ? selectedOrder.bookingDate.toDate().toLocaleDateString('en-IN') : 'N/A';
    
    const ModalItem = ({ label, value, isTotal = false }: { label: string, value: string | number, isTotal?: boolean }) => (
      <View style={isTotal ? styles.modalTotalItem : styles.modalItem}>
        <Text style={isTotal ? styles.modalTotalLabel : styles.modalLabel}>{label}</Text>
        <Text style={isTotal ? styles.modalTotalValue : styles.modalValue}>{value}</Text>
      </View>
    );

    return (
      <Modal visible={isModalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Order Summary</Text>
              
              <Text style={styles.modalSectionTitle}>Customer Details</Text>
              <ModalItem label="Name" value={selectedOrder.customerName || 'N/A'} />
              <ModalItem label="Phone" value={selectedOrder.customerPhone || 'N/A'} />
              <ModalItem label="Address" value={selectedOrder.customerAddress || 'N/A'} />
              <ModalItem label="Booking Date" value={bookingDate} />
              
              <Text style={styles.modalSectionTitle}>Design Details</Text>
              <ModalItem label="Design Type" value={selectedOrder.designType || 'N/A'} />
              <ModalItem label="Size" value={selectedOrder.size || 'N/A'} />
              <ModalItem label="Board Size" value={selectedOrder.boardSize || 'N/A'} />
              <ModalItem label="Slip Size" value={selectedOrder.slipSize || 'N/A'} />
              <ModalItem label="Quantity" value={selectedOrder.quantity || 0} />
              <ModalItem label="Wrapper" value={selectedOrder.wrapper || 0} />

              <Text style={styles.modalSectionTitle}>Price Calculation</Text>
              <ModalItem label="Calendar Price" value={`₹${selectedOrder.costs.calendarPrice.toFixed(2)}`} />
              <ModalItem label="Packing Charge" value={`₹${(selectedOrder.costs.packingCharge || 0).toFixed(2)}`} />
              <ModalItem label="Transport Fee" value={`₹${selectedOrder.costs.transportFee.toFixed(2)}`} />
              <ModalItem label={`GST (${selectedOrder.costs.gstPercent}%)`} value={`₹${selectedOrder.costs.gstAmount.toFixed(2)}`} />
              <ModalItem label="Total Amount" value={`₹${selectedOrder.costs.totalAmount.toFixed(2)}`} isTotal={true} />

            </ScrollView>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalDownloadButton} onPress={handleDownloadPdf}>
                <Feather name="download" size={20} color="#fff" />
                <Text style={styles.modalCloseButtonText}> PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={['#f8f9fa', '#e0eafc']} style={styles.gradientBackground}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <SummaryModal />
        <View style={styles.headerContainer}>
           <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Feather name="arrow-left" size={24} color="#485162" />
            </TouchableOpacity>
            <Text style={styles.title}>View Orders</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'Pending' && styles.tabActive]} onPress={() => setActiveTab('Pending')}>
            <Text style={[styles.tabText, activeTab === 'Pending' && styles.tabTextActive]}>Pending ({pendingOrders.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'Completed' && styles.tabActive]} onPress={() => setActiveTab('Completed')}>
            <Text style={[styles.tabText, activeTab === 'Completed' && styles.tabTextActive]}>Completed ({completedOrders.length})</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator size="large" color="#6a82fb" style={{flex: 1}} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        {!loading && !error && activeTab === 'Pending' && (
          <FlatList data={pendingOrders} renderItem={renderPendingItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 10 }} ListEmptyComponent={<Text style={styles.emptyText}>No pending orders found.</Text>} />
        )}

        {!loading && !error && activeTab === 'Completed' && (
          <View style={{flex: 1}}>
            <View style={styles.statsContainer}><View style={styles.statCard}><Text style={styles.statLabel}>Total Revenue</Text><Text style={styles.statValue}>₹{completedStats.totalRevenue.toFixed(2)}</Text></View><View style={styles.statCard}><Text style={styles.statLabel}>Orders Completed</Text><Text style={styles.statValue}>{completedStats.orderCount}</Text></View></View>
            <FlatList data={completedOrders} renderItem={renderCompletedItem} keyExtractor={item => item.id} contentContainerStyle={{ padding: 10 }} ListEmptyComponent={<Text style={styles.emptyText}>No completed orders found.</Text>} />
          </View>
        )}

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBackground: { flex: 1 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, },
  backButton: { padding: 10, marginRight: 10, },
  title: { fontSize: 28, fontFamily: 'Poppins-Bold', color: '#1a253a', },
  tabContainer: { flexDirection: 'row', justifyContent: 'space-around', margin: 20, backgroundColor: '#fff', borderRadius: 30, padding: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, },
  tab: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 25, },
  tabActive: { backgroundColor: '#6a82fb', },
  tabText: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#555', },
  tabTextActive: { fontFamily: 'Poppins-Bold', color: '#fff', },
  card: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 4, },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, },
  cardLabel: { fontFamily: 'Poppins-Bold', color: '#555', },
  cardText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#333', },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, },
  actionButtonComplete: { backgroundColor: '#28a745', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', },
  actionButtonCancel: { backgroundColor: '#dc3545', flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignItems: 'center', },
  actionButtonText: { color: '#fff', fontFamily: 'Poppins-Bold', fontSize: 12, marginLeft: 5, },
  emptyText: { textAlign: 'center', marginTop: 50, fontFamily: 'Poppins-Regular', fontSize: 16, color: '#777', },
  errorText: { textAlign: 'center', marginTop: 50, fontFamily: 'Poppins-Bold', fontSize: 16, color: '#dc3545', },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20, },
  modalContent: { width: '100%', maxHeight: '85%', backgroundColor: '#fff', borderRadius: 20, padding: 25, },
  modalTitle: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#1a253a', marginBottom: 20, textAlign: 'center', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 15, },
  modalSectionTitle: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#485162', marginTop: 15, marginBottom: 10, },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', },
  modalLabel: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#555', },
  modalValue: { fontFamily: 'Poppins-Bold', fontSize: 16, color: '#1a253a', flexShrink: 1, textAlign: 'right' },
  modalTotalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderTopWidth: 2, borderTopColor: '#ddd', marginTop: 15, },
  modalTotalLabel: { fontFamily: 'Poppins-Bold', fontSize: 18, color: '#1a253a', },
  modalTotalValue: { fontFamily: 'Poppins-Bold', fontSize: 20, color: '#28a745', },
  modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, },
  modalCloseButton: { backgroundColor: '#6c757d', paddingVertical: 15, borderRadius: 20, flex: 1, marginRight: 10, alignItems: 'center', },
  modalDownloadButton: { backgroundColor: '#6a82fb', paddingVertical: 15, borderRadius: 20, flex: 1, marginLeft: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', },
  modalCloseButtonText: { color: '#fff', textAlign: 'center', fontFamily: 'Poppins-Bold', fontSize: 16, marginLeft: 5, },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 10, },
  statCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, alignItems: 'center', width: '45%', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5, },
  statLabel: { fontFamily: 'Poppins-Regular', fontSize: 14, color: '#777', },
  statValue: { fontFamily: 'Poppins-Bold', fontSize: 22, color: '#1a253a', marginTop: 5, },
});

