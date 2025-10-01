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
    'store.orderProducts': 'Order products for your stores',
    'store.noProducts': 'No products available',
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
    'cart.orderSummary': 'Order Summary',
    'cart.reviewItems': 'Review your items before checkout',
    'cart.kitProducts': 'Kit Products',
    'cart.individualProducts': 'Individual Products',
    'cart.billedToHO': 'Billed to HO',
    'cart.billedToHeadOffice': 'Billed to Head Office',
    'cart.creditCardPayment': 'Credit Card Payment',
    'cart.generalOrder': 'General Order',
    'cart.item': 'item',
    'cart.items': 'items',
    'cart.quantity': 'Quantity',
    'cart.storeSubtotal': 'Store Subtotal',
    'cart.size': 'Size',
    'cart.each': 'each',
    'cart.kitProductsTotal': 'Kit Products Total',
    'cart.individualProductsTotal': 'Individual Products Total',
    'cart.creditCardCharge': 'Credit Card Charge',
    'cart.processing': 'Processing...',
    'cart.continueShopping': 'Continue Shopping',
    'cart.subtotal': 'Subtotal',
    'cart.shipping': 'Shipping',
    'cart.tax': 'Tax (13%)',
    'cart.totalWithTaxShipping': 'Total (incl. tax & shipping)',
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
    'store.orderProducts': 'Commandez des produits pour vos magasins',
    'store.noProducts': 'Aucun produit disponible',
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
    'cart.orderSummary': 'Résumé de commande',
    'cart.reviewItems': 'Vérifiez vos articles avant de passer à la caisse',
    'cart.kitProducts': 'Produits ensemble',
    'cart.individualProducts': 'Produits individuels',
    'cart.billedToHO': 'Facturé au siège social',
    'cart.billedToHeadOffice': 'Facturé au siège social',
    'cart.creditCardPayment': 'Paiement par carte de crédit',
    'cart.generalOrder': 'Commande générale',
    'cart.item': 'article',
    'cart.items': 'articles',
    'cart.quantity': 'Quantité',
    'cart.storeSubtotal': 'Sous-total magasin',
    'cart.size': 'Taille',
    'cart.each': 'chacun',
    'cart.kitProductsTotal': 'Total produits ensemble',
    'cart.individualProductsTotal': 'Total produits individuels',
    'cart.creditCardCharge': 'Frais carte de crédit',
    'cart.processing': 'Traitement en cours...',
    'cart.continueShopping': 'Continuer les achats',
    'cart.subtotal': 'Sous-total',
    'cart.shipping': 'Expédition',
    'cart.tax': 'Taxe (13%)',
    'cart.totalWithTaxShipping': 'Total (taxes et expédition incluses)',
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
