import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CartItem } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size?: string, storeId?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string, storeId?: string) => void;
  clearCart: () => void;
  kitTotal: number;
  individualTotal: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load cart from localStorage on initialization
    try {
      const savedCart = localStorage.getItem('timhortons-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  // Save cart to localStorage whenever items change
  useEffect(() => {
    try {
      localStorage.setItem('timhortons-cart', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  const addItem = (item: CartItem) => {
    // Check if trying to add a kit when one already exists
    if (item.product.isKit) {
      const hasKit = items.some(i => i.product.isKit);
      if (hasKit) {
        throw new Error('ONLY_ONE_KIT_ALLOWED');
      }
    }

    setItems(prev => {
      const existingIndex = prev.findIndex(
        i => i.product.id === item.product.id && i.size === item.size && i.storeId === item.storeId
      );

      if (existingIndex > -1) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += item.quantity;
        return newItems;
      }

      return [...prev, item];
    });
  };

  const removeItem = (productId: string, size?: string, storeId?: string) => {
    setItems(prev => prev.filter(item => {
      if (item.product.id !== productId) return true;
      if (size !== undefined && item.size !== size) return true;
      if (storeId !== undefined && item.storeId !== storeId) return true;
      return false;
    }));
  };

  const updateQuantity = (productId: string, quantity: number, size?: string, storeId?: string) => {
    if (quantity <= 0) {
      removeItem(productId, size, storeId);
      return;
    }
    setItems(prev =>
      prev.map(item => {
        if (item.product.id !== productId) return item;
        if (size !== undefined && item.size !== size) return item;
        if (storeId !== undefined && item.storeId !== storeId) return item;
        return { ...item, quantity };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    // Also clear from localStorage
    try {
      localStorage.removeItem('timhortons-cart');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  const kitTotal = items
    .filter(item => item.product.isKit)
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const individualTotal = items
    .filter(item => !item.product.isKit)
    .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const total = kitTotal + individualTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        kitTotal,
        individualTotal,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
