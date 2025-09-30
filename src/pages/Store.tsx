import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
}

export default function Store() {
  const { t } = useLanguage();
  const { addItem } = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Fetch user's stores
      const { data: userStores } = await supabase
        .from('user_stores')
        .select('store_id, stores(id, name)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (userStores) {
        const storeList = userStores
          .map(us => us.stores)
          .filter(Boolean) as Store[];
        setStores(storeList);
        if (storeList.length > 0) {
          setSelectedStore(storeList[0].id);
        }
      }

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      // Fetch kits
      const { data: kitsData } = await supabase
        .from('kits')
        .select('*')
        .eq('is_active', true);

      // Combine products and kits into a unified Product array
      const allProducts: Product[] = [
        ...(productsData || []).map(p => ({
          id: p.id,
          nameEn: p.name_en,
          nameFr: p.name_fr,
          descriptionEn: p.description_en || '',
          descriptionFr: p.description_fr || '',
          price: Number(p.price),
          category: p.category,
          images: p.images,
          sizes: p.sizes || undefined,
          isKit: false,
        })),
        ...(kitsData || []).map(k => ({
          id: k.id,
          nameEn: k.name_en,
          nameFr: k.name_fr,
          descriptionEn: k.description_en || '',
          descriptionFr: k.description_fr || '',
          price: 0,
          category: k.category,
          images: k.images,
          isKit: true,
        })),
      ];

      setProducts(allProducts);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      product,
      quantity: 1,
      size: product.sizes?.[0]
    });
    toast.success('Added to cart!');
  };

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <p className="text-center">Loading products...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t('nav.store')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Order products for your stores
            </p>
          </div>

          {stores.length > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t('store.selectStore')} />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('all')}
            size="sm"
          >
            {t('store.allItems')}
          </Button>
          {categories.slice(1).map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category}
            </Button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <p className="text-center text-muted-foreground">No products available</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
