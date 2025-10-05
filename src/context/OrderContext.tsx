import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the structure of the entire order
interface OrderDetails {
  // Customer Details
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  // Design Type
  designType?: 'Customize' | 'Readymade';
  // Customization Details
  size?: string;
  boardSize?: string;
  slipSize?: string;
  // Quantity Details
  quantity?: number;
  wrapper?: number;
}

// Define the context type
interface OrderContextType {
  orderDetails: OrderDetails;
  updateOrderDetails: (details: Partial<OrderDetails>) => void;
  resetOrder: () => void;
}

// Create the context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Create the provider component
export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails>({});

  const updateOrderDetails = (details: Partial<OrderDetails>) => {
    setOrderDetails(prev => ({ ...prev, ...details }));
  };
  
  const resetOrder = () => {
    setOrderDetails({});
  };

  return (
    <OrderContext.Provider value={{ orderDetails, updateOrderDetails, resetOrder }}>
      {children}
    </OrderContext.Provider>
  );
};

// Create a custom hook to easily use the context
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
