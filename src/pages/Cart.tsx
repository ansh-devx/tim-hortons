import { useState, useEffect } from 'react';
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

interface Store {
  id: string;
  name: string;
}

// Constants for tax and shipping calculations
const TAX_RATE = 0.13; // 13% tax
const SHIPPING_RATE = 9.99; // Fixed shipping rate

export default function Cart() {
  const { items, removeItem, updateQuantity, kitTotal, individualTotal, total, clearCart } = useCart();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    loadStores();
  }, []);

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
      }
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const getStoreName = (storeId?: string) => {
    if (!storeId) return '';
    const store = stores.find(s => s.id === storeId);
    return store ? store.name : 'Unknown Store';
  };

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
          shipping_amount: shipping_amount,
          tax_amount: tax_amount,
          tax_rate: TAX_RATE,
          total: kitTotal + finalTotal, // Include shipping and tax in total
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

  // Calculate shipping and tax (only applied to individual items, not kits)
  const subtotal = individualTotal;
  const shipping_amount = individualTotal > 0 ? SHIPPING_RATE : 0;
  const tax_amount = (subtotal + shipping_amount) * TAX_RATE;
  const finalTotal = subtotal + shipping_amount + tax_amount;

  // Group items by store
  const groupItemsByStore = (items: typeof kitItems) => {
    const grouped: { [storeId: string]: typeof items } = {};
    items.forEach(item => {
      const storeId = item.storeId || 'no-store';
      if (!grouped[storeId]) {
        grouped[storeId] = [];
      }
      grouped[storeId].push(item);
    });
    return grouped;
  };

  const groupedKitItems = groupItemsByStore(kitItems);
  const groupedIndividualItems = groupItemsByStore(individualItems);

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
          <div className="space-y-8 lg:col-span-2">
            {/* Kit Products Section */}
            {kitItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1 bg-red-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('cart.kitSubtotal')}
                  </h2>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    {t('cart.billedToHeadOffice')}
                  </span>
                </div>

                {Object.entries(groupedKitItems).map(([storeId, storeItems]) => (
                  <Card key={storeId} className="border-l-4 border-l-red-600">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {storeId === 'no-store' ? t('cart.generalOrder') : getStoreName(storeId)}
                        </h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          {storeItems.length} {storeItems.length > 1 ? t('cart.items') : t('cart.item')}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {storeItems.map(item => {
                          const name = language === 'en' ? item.product.nameEn : item.product.nameFr;
                          return (
                            <div key={`${item.product.id}-${item.size}-${item.storeId}`} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                              <img
                                src={item.product.images[0]}
                                alt={name}
                                className="h-20 w-20 rounded-md object-cover border"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900">{name}</h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {item.product.category}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-700 font-medium">
                                    {t('cart.quantity')}: {item.quantity}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-col justify-between items-end">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => removeItem(item.product.id, item.size, item.storeId)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium text-green-600">
                                  {t('cart.billedToHO')}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Individual Products Section */}
            {individualItems.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t('cart.individualSubtotal')}
                  </h2>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {t('cart.creditCardPayment')}
                  </span>
                </div>

                {Object.entries(groupedIndividualItems).map(([storeId, storeItems]) => {
                  const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                  return (
                    <Card key={storeId} className="border-l-4 border-l-blue-600">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {storeId === 'no-store' ? t('cart.generalOrder') : getStoreName(storeId)}
                            </h3>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                              {storeItems.length} {storeItems.length > 1 ? t('cart.items') : t('cart.item')}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">{t('cart.storeSubtotal')}</p>
                            <p className="text-lg font-bold text-blue-600">
                              ${formatPrice(storeSubtotal)}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {storeItems.map(item => {
                            const name = language === 'en' ? item.product.nameEn : item.product.nameFr;
                            return (
                              <div key={`${item.product.id}-${item.size}-${item.storeId}`} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                                <img
                                  src={item.product.images[0]}
                                  alt={name}
                                  className="h-20 w-20 rounded-md object-cover border"
                                />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{name}</h4>
                                  <div className="flex gap-4 text-sm text-gray-600 mb-2">
                                    <span>{item.product.category}</span>
                                    {item.size && <span>{t('cart.size')}: {item.size}</span>}
                                  </div>
                                  <p className="text-sm font-semibold text-blue-600 mb-2">
                                    ${formatPrice(item.product.price)} {t('cart.each')}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size, item.storeId)}
                                    >
                                      -
                                    </Button>
                                    <span className="w-12 text-center font-medium bg-white px-2 py-1 rounded border">
                                      {item.quantity}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size, item.storeId)}
                                    >
                                      +
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex flex-col justify-between items-end">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => removeItem(item.product.id, item.size, item.storeId)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-500">{t('cart.total')}</p>
                                    <p className="text-lg font-bold text-gray-900">
                                      ${formatPrice(item.product.price * item.quantity)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced Order Summary */}
          <div>
            <Card className="sticky top-20 shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900">{t('cart.orderSummary')}</h2>
                  <p className="text-sm text-gray-600 mt-1">{t('cart.reviewItems')}</p>
                </div>

                <Separator />

                {/* Kit Products Summary */}
                {kitItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-1 bg-red-600 rounded-full"></div>
                      <h3 className="font-semibold text-gray-800">{t('cart.kitProducts')}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        {t('cart.billedToHO')}
                      </span>
                    </div>
                    <div className="space-y-2 pl-3">
                      {Object.entries(groupedKitItems).map(([storeId, storeItems]) => (
                        <div key={storeId} className="space-y-1">
                          <p className="text-sm font-medium text-gray-700">
                            {storeId === 'no-store' ? t('cart.generalOrder') : getStoreName(storeId)}
                          </p>
                          {storeItems.map(item => {
                            const name = language === 'en' ? item.product.nameEn : item.product.nameFr;
                            return (
                              <div key={`${item.product.id}-${item.size}-${item.storeId}`} className="flex justify-between text-sm pl-2">
                                <span className="text-gray-600">
                                  {name} × {item.quantity}
                                </span>
                                <span></span>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {kitItems.length > 0 && individualItems.length > 0 && <Separator />}

                {/* Individual Products Summary */}
                {individualItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                      <h3 className="font-semibold text-gray-800">{t('cart.individualProducts')}</h3>
                    </div>
                    <div className="space-y-2 pl-3">
                      {Object.entries(groupedIndividualItems).map(([storeId, storeItems]) => {
                        const storeSubtotal = storeItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
                        return (
                          <div key={storeId} className="space-y-1">
                            <div className="flex justify-between text-sm font-medium text-gray-700">
                              <span>{storeId === 'no-store' ? t('cart.generalOrder') : getStoreName(storeId)}</span>
                              <span className="text-blue-600">${formatPrice(storeSubtotal)}</span>
                            </div>
                            {storeItems.map(item => {
                              const name = language === 'en' ? item.product.nameEn : item.product.nameFr;
                              return (
                                <div key={`${item.product.id}-${item.size}-${item.storeId}`} className="flex justify-between text-sm pl-2">
                                  <span className="text-gray-600">
                                    {name} × {item.quantity}
                                  </span>
                                  <span className="text-gray-800">
                                    ${formatPrice(item.product.price * item.quantity)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Payment Summary */}
                <div className="space-y-3">
                  {kitTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('cart.kitProductsTotal')}</span>
                      <span className="text-green-600 font-medium">{t('cart.billedToHeadOffice')}</span>
                    </div>
                  )}

                  {individualTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('cart.subtotal')}</span>
                      <span className="font-medium text-gray-800">${formatPrice(subtotal)}</span>
                    </div>
                  )}

                  {shipping_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('cart.shipping')}</span>
                      <span className="font-medium text-gray-800">${formatPrice(shipping_amount)}</span>
                    </div>
                  )}

                  {tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{t('cart.tax')}</span>
                      <span className="font-medium text-gray-800">${formatPrice(tax_amount)}</span>
                    </div>
                  )}

                  {individualTotal > 0 && <Separator />}

                  {/* <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total Amount</span>
                    <span className="text-gray-900">
                      {individualTotal > 0 ? `$${formatPrice(individualTotal)}` : '$0.00'}
                    </span>
                  </div> */}

                  {individualTotal > 0 && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-lg font-bold border-t pt-3">
                        <span className="text-gray-900">{t('cart.totalWithTaxShipping')}</span>
                        <span className="text-gray-900">${formatPrice(finalTotal)}</span>
                      </div>

                      <div className="flex justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <img src="/credit-card.svg" alt="Credit card" className="h-4 w-4" />
                          <p className="text-sm font-semibold text-green-800">
                            {t('cart.creditCardCharge')}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-green-700">
                          ${formatPrice(finalTotal)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-3 pt-2">
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? t('cart.processing') : t('cart.checkout')}
                  </Button>

                  <Link to="/store">
                    <Button variant="outline" className="w-full border-red-600 text-red-600 hover:bg-red-50">
                      {t('cart.continueShopping')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
