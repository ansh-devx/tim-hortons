import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/types';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface Store {
  id: string;
  name: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
    loadStores();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    try {
      setLoading(true);

      // Try to fetch as a product first
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (productData) {
        setProduct({
          id: productData.id,
          nameEn: productData.name_en,
          nameFr: productData.name_fr,
          descriptionEn: productData.description_en || '',
          descriptionFr: productData.description_fr || '',
          price: Number(productData.price),
          category: productData.category,
          categoryFr: productData.category_fr,
          images: productData.images,
          sizes: productData.sizes || undefined,
          isKit: false,
        });
        return;
      }

      // If not found, try to fetch as a kit
      const { data: kitData } = await supabase
        .from('kits')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (kitData) {
        setProduct({
          id: kitData.id,
          nameEn: kitData.name_en,
          nameFr: kitData.name_fr,
          descriptionEn: kitData.description_en || '',
          descriptionFr: kitData.description_fr || '',
          price: 0,
          category: kitData.category,
          categoryFr: kitData.category_fr,
          images: kitData.images,
          isKit: true,
          products: kitData.products || [], // Include the products array
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data: userStores } = await supabase
        .from('user_stores')
        .select('store_id, stores(id, name)')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (userStores) {
        const storeList = userStores
          .map(us => us.stores)
          .filter(Boolean) as Store[];
        setStores(storeList);
        // Auto-select all stores by default
        setSelectedStores(storeList.map(store => store.id));
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          {/* <p className="text-center">Loading...</p> */}
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <p>Product not found</p>
        </main>
      </div>
    );
  }

  const name = language === 'en' ? product.nameEn : product.nameFr;
  const description = language === 'en' ? product.descriptionEn : product.descriptionFr;

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores(prev =>
      prev.includes(storeId)
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
  };

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) {
      toast.error(t('product.selectSize'));
      return;
    }

    if (selectedStores.length === 0) {
      toast.error(language === 'en' ? 'Please select at least one store' : 'Veuillez sélectionner au moins un magasin');
      return;
    }

    try {
      // Add item for each selected store
      selectedStores.forEach(storeId => {
        addItem({
          product,
          quantity: product.isKit ? 1 : quantity,
          size: selectedSize,
          storeId,
        });
      });

      const storeCount = selectedStores.length;
      toast.success(
        language === 'en'
          ? `${name} added to cart for ${storeCount} store${storeCount > 1 ? 's' : ''}`
          : `${name} ajouté au panier pour ${storeCount} magasin${storeCount > 1 ? 's' : ''}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'ONLY_ONE_KIT_ALLOWED') {
          toast.error('You can only add one kit per order. Please checkout your current kit first.');
        } else {
          toast.error('Failed to add item to cart');
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-secondary">
              <img
                src={product.images[selectedImage]}
                alt={name}
                className="h-full w-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square w-20 overflow-hidden rounded-md border-2 transition-all ${selectedImage === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-border'
                      }`}
                  >
                    <img
                      src={image}
                      alt={`${name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <div className="mb-2 flex items-start gap-2">
                <h1 className="flex-1 text-3xl font-bold text-foreground">{name}</h1>
                <Badge variant="secondary" className="text-sm bg-red-600 text-white">
                  {product.isKit ? 'Kit' : 'Individual'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{product.category}</p>
            </div>

            <div className="text-2xl font-bold text-primary">
              {product.isKit ? (
                <span className="text-base text-muted-foreground">Billed to Head Office</span>
              ) : (
                `$${formatPrice(product.price)}`
              )}
            </div>

            <p className="text-foreground leading-relaxed">{description}</p>

            {/* Kit Contents Section */}
            {product.isKit && product.products && product.products.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground">
                  {language === 'en' ? 'Kit Contents:' : 'Contenu du kit :'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <ul className="space-y-2">
                    {product.products.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span className="text-gray-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {product.sizes && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('product.selectSize')}
                </label>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('product.selectSize')} />
                  </SelectTrigger>
                  <SelectContent>
                    {product.sizes.map(size => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {!product.isKit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            )}

            {stores.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {language === 'en' ? 'Select Stores' : 'Sélectionner les magasins'}
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStores(stores.map(s => s.id))}
                      className="text-xs h-7 px-2"
                    >
                      {language === 'en' ? 'Select All' : 'Tout sélectionner'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedStores([])}
                      className="text-xs h-7 px-2"
                    >
                      {language === 'en' ? 'Clear All' : 'Tout effacer'}
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                  <div className="space-y-3">
                    {stores.map(store => (
                      <label
                        key={store.id}
                        className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-white transition-colors"
                      >
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={selectedStores.includes(store.id)}
                            onChange={() => toggleStore(store.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedStores.includes(store.id)
                            ? 'bg-red-600 border-red-600'
                            : 'border-gray-300 bg-white hover:border-red-400'
                            }`}>
                            {selectedStores.includes(store.id) && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-900">{store.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {selectedStores.length} of {stores.length} stores selected
                  </span>
                  {selectedStores.length === 0 && (
                    <span className="text-red-500 font-medium">
                      {language === 'en' ? 'Please select at least one store' : 'Veuillez sélectionner au moins un magasin'}
                    </span>
                  )}
                </div>
              </div>
            )}

            <Button onClick={handleAddToCart} className="w-full" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              {t('product.addToCart')}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
