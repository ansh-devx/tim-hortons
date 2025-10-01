import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { ShoppingCart, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name_en: string;
  name_fr: string;
  category: string;
  price: number;
  images: string[];
  is_kit?: boolean;
}

interface BulkOrderItem {
  productId: string;
  storeId: string;
  quantity: number;
}

export default function BulkOrder() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [kits, setKits] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<BulkOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      // Load stores assigned to user
      const { data: userStores, error: storesError } = await supabase
        .from('user_stores')
        .select('store_id, stores(id, name)')
        .eq('user_id', user?.id);

      if (storesError) throw storesError;

      const storesList = userStores
        ?.map(us => us.stores)
        .filter(Boolean) as Store[];
      setStores(storesList || []);

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Convert database products to our interface format
      const formattedProducts = (productsData || []).map(p => ({
        id: p.id,
        name_en: p.name_en,
        name_fr: p.name_fr,
        category: p.category,
        price: p.price,
        images: p.images || ['/placeholder-product.jpg'],
        is_kit: false,
      }));

      setProducts(formattedProducts);

      // Load kits
      const { data: kitsData, error: kitsError } = await supabase
        .from('kits')
        .select('*')
        .eq('is_active', true);

      if (kitsError) throw kitsError;

      const kitsAsProducts = kitsData?.map(kit => ({
        id: kit.id,
        name_en: kit.name_en,
        name_fr: kit.name_fr,
        category: kit.category,
        price: 0,
        images: kit.images || ['/placeholder-product.jpg'],
        is_kit: true,
      })) || [];

      setKits(kitsAsProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const updateQuantity = (productId: string, storeId: string, quantity: number) => {
    // Find the product to check if it's a kit
    const product = [...products, ...kits].find(p => p.id === productId);

    // For kits, force quantity to be either 0 or 1
    if (product?.is_kit) {
      quantity = quantity > 0 ? 1 : 0;
    }

    setOrderItems(prev => {
      const existing = prev.find(
        item => item.productId === productId && item.storeId === storeId
      );

      if (quantity <= 0) {
        return prev.filter(
          item => !(item.productId === productId && item.storeId === storeId)
        );
      }

      if (existing) {
        return prev.map(item =>
          item.productId === productId && item.storeId === storeId
            ? { ...item, quantity }
            : item
        );
      }

      return [...prev, { productId, storeId, quantity }];
    });
  };

  const getQuantity = (productId: string, storeId: string) => {
    const item = orderItems.find(
      i => i.productId === productId && i.storeId === storeId
    );
    return item?.quantity || 0;
  };

  const handleAddToCart = async () => {
    if (orderItems.length === 0) {
      toast.error(
        language === 'en'
          ? 'Please add items to your selection'
          : 'Veuillez ajouter des articles à votre sélection'
      );
      return;
    }

    setSubmitting(true);

    try {
      let addedCount = 0;

      // Add each item to cart
      for (const item of orderItems) {
        const product = [...products, ...kits].find(p => p.id === item.productId);

        if (product) {
          // Convert the bulk order product format to cart product format
          const cartProduct = {
            id: product.id,
            nameEn: product.name_en,
            nameFr: product.name_fr,
            descriptionEn: '', // Default empty description
            descriptionFr: '', // Default empty description
            category: product.category,
            price: product.price,
            images: product.images || ['/placeholder-product.jpg'], // Use actual product images
            isKit: product.is_kit || false,
          };

          // Add to cart with store information
          addItem({
            product: cartProduct,
            quantity: item.quantity,
            storeId: item.storeId,
          });

          addedCount++;
        }
      }

      toast.success(
        language === 'en'
          ? `${addedCount} item(s) added to cart successfully!`
          : `${addedCount} article(s) ajouté(s) au panier avec succès!`
      );

      // Clear the bulk order selections
      setOrderItems([]);

      // Navigate to cart
      navigate('/cart');
    } catch (error) {
      console.error('Error adding items to cart:', error);
      toast.error(
        language === 'en'
          ? 'Failed to add items to cart'
          : 'Échec de l\'ajout des articles au panier'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const categories = ['all', ...new Set([...products, ...kits].map(p => p.category))];
  const filteredItems = selectedCategory === 'all'
    ? [...products, ...kits]
    : [...products, ...kits].filter(p => p.category === selectedCategory);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          {/* <div className="text-center text-muted-foreground">Loading...</div> */}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {language === 'en' ? 'Bulk Order' : 'Commande en gros'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'en'
              ? 'Order products for multiple stores at once'
              : 'Commander des produits pour plusieurs magasins à la fois'}
          </p>
        </div>

        {/* Store Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {language === 'en' ? 'Select Stores' : 'Sélectionner les magasins'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map(store => (
                <div key={store.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={store.id}
                    checked={selectedStores.includes(store.id)}
                    onCheckedChange={() => toggleStore(store.id)}
                  />
                  <label
                    htmlFor={store.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {store.name}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {selectedStores.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            {language === 'en'
              ? 'Please select at least one store to begin ordering'
              : 'Veuillez sélectionner au moins un magasin pour commencer'}
          </div>
        )}

        {selectedStores.length > 0 && (
          <>
            {/* Category Filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  size="sm"
                >
                  {category === 'all'
                    ? language === 'en' ? 'All Items' : 'Tous les articles'
                    : category}
                </Button>
              ))}
            </div>

            {/* Products Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          {language === 'en' ? 'Product' : 'Produit'}
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium">
                          {language === 'en' ? 'Category' : 'Catégorie'}
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium">
                          {language === 'en' ? 'Price' : 'Prix'}
                        </th>
                        {selectedStores.map(storeId => (
                          <th key={storeId} className="px-4 py-3 text-center text-sm font-medium">
                            {stores.find(s => s.id === storeId)?.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredItems.map(item => (
                        <tr key={item.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {item.is_kit ? (
                                <Package className="h-4 w-4 text-primary" />
                              ) : (
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium">
                                {language === 'en' ? item.name_en : item.name_fr}
                              </span>
                              {item.is_kit && (
                                <Badge variant="kit" className="text-xs">
                                  {language === 'en' ? 'Kit' : 'Trousse'}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {item.category}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.is_kit ? (
                              <span className="text-xs text-muted-foreground">
                                {language === 'en' ? 'Billed to HO' : 'Facturé au siège'}
                              </span>
                            ) : (
                              <span className="font-medium">${formatPrice(item.price)}</span>
                            )}
                          </td>
                          {selectedStores.map(storeId => (
                            <td key={storeId} className="px-4 py-3">
                              <div className="flex justify-center">
                                {item.is_kit ? (
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={getQuantity(item.id, storeId) > 0}
                                      onCheckedChange={(checked) =>
                                        updateQuantity(item.id, storeId, checked ? 1 : 0)
                                      }
                                    />
                                    <span className="text-sm text-gray-600">
                                      {getQuantity(item.id, storeId) > 0 ? '1' : '0'}
                                    </span>
                                  </div>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    value={getQuantity(item.id, storeId) || ''}
                                    onChange={(e) =>
                                      updateQuantity(
                                        item.id,
                                        storeId,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 text-center"
                                    placeholder="0"
                                  />
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Add to Cart Button */}
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate('/store')}>
                {language === 'en' ? 'Cancel' : 'Annuler'}
              </Button>
              <Button
                onClick={handleAddToCart}
                disabled={submitting || orderItems.length === 0}
                size="lg"
                className="bg-red-600 hover:bg-red-700"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {submitting
                  ? language === 'en' ? 'Adding to cart...' : 'Ajout au panier...'
                  : language === 'en'
                    ? `Add to Cart (${orderItems.length} items)`
                    : `Ajouter au panier (${orderItems.length} articles)`}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
