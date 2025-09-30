import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export default function Cart() {
  const { items, removeItem, updateQuantity, kitTotal, individualTotal, total, clearCart } = useCart();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please log in to checkout');
      navigate('/login');
      return;
    }

    setIsCheckingOut(true);
    try {
      // Get user's first assigned store
      const { data: userStores, error: storesError } = await supabase
        .from('user_stores')
        .select('store_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (storesError || !userStores) {
        toast.error('No store assigned to your account');
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          store_id: userStores.store_id,
          order_number: `ORD-${Date.now()}`,
          kit_subtotal: kitTotal,
          individual_subtotal: individualTotal,
          total: total,
          order_status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.isKit ? null : item.product.id,
        kit_id: item.product.isKit ? item.product.id : null,
        quantity: item.quantity,
        size: item.size,
        unit_price: item.product.price,
        extended_price: item.product.price * item.quantity,
        is_kit: item.product.isKit
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const kitItems = items.filter(item => item.product.isKit);
  const individualItems = items.filter(item => !item.product.isKit);

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('cart.empty')}</h2>
            <Link to="/store">
              <Button className="mt-4">{t('nav.store')}</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">{t('cart.title')}</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {kitItems.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    {t('cart.kitSubtotal')}
                    <span className="text-sm font-normal text-muted-foreground">
                      (Billed to Head Office)
                    </span>
                  </h2>
                  <div className="space-y-4">
                    {kitItems.map(item => {
                      const name = language === 'en' ? item.product.nameEn : item.product.nameFr;
                      return (
                        <div key={`${item.product.id}-${item.size}`} className="flex gap-4">
                          <img
                            src={item.product.images[0]}
                            alt={name}
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {item.product.category}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {individualItems.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    {t('cart.individualSubtotal')}
                  </h2>
                  <div className="space-y-4">
                    {individualItems.map(item => {
                      const name = language === 'en' ? item.product.nameEn : item.product.nameFr;
                      return (
                        <div key={`${item.product.id}-${item.size}`} className="flex gap-4">
                          <img
                            src={item.product.images[0]}
                            alt={name}
                            className="h-20 w-20 rounded-md object-cover"
                          />
                          <div className="flex-1">
                            <h3 className="font-medium">{name}</h3>
                            {item.size && (
                              <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                            )}
                            <p className="text-sm font-semibold text-primary">
                              ${formatPrice(item.product.price)}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeItem(item.product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <p className="font-semibold">
                              ${formatPrice(item.product.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card className="sticky top-20">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-xl font-semibold">Order Summary</h2>
                
                <Separator />
                
                {kitTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.kitSubtotal')}</span>
                    <span className="text-muted-foreground">Billed to HO</span>
                  </div>
                )}
                
                {individualTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart.individualSubtotal')}</span>
                    <span className="font-medium">${formatPrice(individualTotal)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('cart.total')}</span>
                  <span className="text-primary">
                    {individualTotal > 0 ? `$${formatPrice(individualTotal)}` : '$0.00'}
                  </span>
                </div>

                {individualTotal > 0 && (
                  <p className="text-xs text-muted-foreground">
                    * Credit card charge: ${formatPrice(individualTotal)}
                  </p>
                )}
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? 'Processing...' : t('cart.checkout')}
                </Button>

                <Link to="/store">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
