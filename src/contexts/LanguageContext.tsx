import React, { createContext, useContext, useState } from 'react';
import type { Language } from '@/types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'nav.store': 'Home',
    'nav.orders': 'My Orders',
    'nav.cart': 'Cart',
    'auth.login': 'Login',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.signin': 'Sign In',
    'auth.welcome': 'Welcome Back',
    'store.selectStore': 'Select Store',
    'store.allItems': 'All Items',
    'product.addToCart': 'Add to Cart',
    'product.selectSize': 'Select Size',
    'product.kit': 'Kit',
    'product.individual': 'Individual Item',
    'cart.title': 'Shopping Cart',
    'cart.kitSubtotal': 'Kit Subtotal',
    'cart.individualSubtotal': 'Individual Items',
    'cart.total': 'Total',
    'cart.checkout': 'Proceed to Checkout',
    'cart.empty': 'Your cart is empty',
  },
  fr: {
    'nav.store': 'Accueil',
    'nav.orders': 'Mes Commandes',
    'nav.cart': 'Panier',
    'auth.login': 'Connexion',
    'auth.email': 'Courriel',
    'auth.password': 'Mot de passe',
    'auth.signin': 'Se connecter',
    'auth.welcome': 'Bon retour',
    'store.selectStore': 'Sélectionner le magasin',
    'store.allItems': 'Tous les articles',
    'product.addToCart': 'Ajouter au panier',
    'product.selectSize': 'Sélectionner la taille',
    'product.kit': 'Ensemble',
    'product.individual': 'Article individuel',
    'cart.title': 'Panier',
    'cart.kitSubtotal': 'Sous-total ensemble',
    'cart.individualSubtotal': 'Articles individuels',
    'cart.total': 'Total',
    'cart.checkout': 'Passer à la caisse',
    'cart.empty': 'Votre panier est vide',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
