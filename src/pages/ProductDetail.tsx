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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    loadProduct();
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
          images: kitData.images,
          isKit: true,
        });
      }
    } catch (error) {
      console.error('Error loading product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <p className="text-center">Loading...</p>
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

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) {
      toast.error(t('product.selectSize'));
      return;
    }

    addItem({
      product,
      quantity,
      size: selectedSize,
    });

    toast.success(
      language === 'en' 
        ? `${name} added to cart` 
        : `${name} ajouté au panier`
    );
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
                    className={`aspect-square w-20 overflow-hidden rounded-md border-2 transition-all ${
                      selectedImage === index
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
                {product.isKit && (
                  <Badge variant="kit" className="text-sm">
                    {t('product.kit')}
                  </Badge>
                )}
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
