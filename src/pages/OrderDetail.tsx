import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  extended_price: number;
  size?: string;
  is_kit: boolean;
  products?: {
    name_en: string;
    name_fr: string;
    images: string[];
  };
  kits?: {
    name_en: string;
    name_fr: string;
    images: string[];
  };
}

interface Order {
  id: string;
  order_number: string;
  store_id: string;
  order_status: string;
  payment_status: string;
  kit_subtotal: number;
  individual_subtotal: number;
  total: number;
  created_at: string;
  notes?: string;
  stores?: {
    name: string;
  };
}

export default function OrderDetail() {
  const { orderId } = useParams();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrderDetails();
  }, [orderId, user, navigate]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          stores(name)
        `)
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name_en, name_fr, images),
          kits(name_en, name_fr, images)
        `)
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;
      setOrderItems(itemsData || []);
    } catch (error) {
      console.error('Error loading order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      draft: 'bg-gray-500',
      pending: 'bg-yellow-500',
      approved: 'bg-blue-500',
      processing: 'bg-purple-500',
      shipped: 'bg-indigo-500',
      delivered: 'bg-green-500',
      cancelled: 'bg-red-500',
    };

    return (
      <Badge className={`${statusColors[status]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const paymentColors: Record<string, string> = {
      pending: 'bg-yellow-500',
      paid: 'bg-green-500',
      failed: 'bg-red-500',
      refunded: 'bg-gray-500',
    };

    return (
      <Badge className={`${paymentColors[status]} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const kitItems = orderItems.filter(item => item.is_kit);
  const individualItems = orderItems.filter(item => !item.is_kit);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <div className="text-center text-muted-foreground">
            {language === 'en' ? 'Loading order details...' : 'Chargement des détails...'}
          </div>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <div className="text-center text-muted-foreground">
            {language === 'en' ? 'Order not found' : 'Commande introuvable'}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8 px-4 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'en' ? 'Back to Orders' : 'Retour aux commandes'}
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">
                  {order.order_number}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.stores?.name}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(order.order_status)}
                {getPaymentBadge(order.payment_status)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Order Date' : 'Date de commande'}
                  </p>
                  <p className="font-medium">
                    {formatDate(order.created_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Total Items' : 'Total articles'}
                  </p>
                  <p className="font-medium">
                    {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    {language === 'en' ? 'Your Total' : 'Votre total'}
                  </p>
                  <p className="font-medium text-primary">
                    ${formatPrice(order.individual_subtotal)}
                  </p>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-1">
                  {language === 'en' ? 'Notes' : 'Remarques'}
                </p>
                <p className="text-sm">{order.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {kitItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {language === 'en' ? 'Kit Items' : 'Articles trousse'}
                <span className="text-sm font-normal text-muted-foreground">
                  ({language === 'en' ? 'Billed to Head Office' : 'Facturé au siège'})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {kitItems.map(item => {
                  const name = language === 'en' ? item.kits?.name_en : item.kits?.name_fr;
                  const image = item.kits?.images?.[0] || '/placeholder.svg';
                  
                  return (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={image}
                        alt={name || ''}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Quantity' : 'Quantité'}: {item.quantity}
                        </p>
                        {item.size && (
                          <p className="text-sm text-muted-foreground">
                            {language === 'en' ? 'Size' : 'Taille'}: {item.size}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Billed to HO' : 'Facturé au siège'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-between text-sm">
                <span className="font-medium">
                  {language === 'en' ? 'Kit Subtotal' : 'Sous-total trousse'}
                </span>
                <span className="text-muted-foreground">
                  ${formatPrice(order.kit_subtotal)}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {individualItems.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {language === 'en' ? 'Individual Items' : 'Articles individuels'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {individualItems.map(item => {
                  const name = language === 'en' ? item.products?.name_en : item.products?.name_fr;
                  const image = item.products?.images?.[0] || '/placeholder.svg';
                  
                  return (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={image}
                        alt={name || ''}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Quantity' : 'Quantité'}: {item.quantity}
                        </p>
                        {item.size && (
                          <p className="text-sm text-muted-foreground">
                            {language === 'en' ? 'Size' : 'Taille'}: {item.size}
                          </p>
                        )}
                        <p className="text-sm font-semibold text-primary mt-1">
                          ${formatPrice(item.unit_price)} {language === 'en' ? 'each' : 'chacun'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${formatPrice(item.extended_price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">
                    {language === 'en' ? 'Individual Subtotal' : 'Sous-total individuel'}
                  </span>
                  <span className="font-medium">
                    ${formatPrice(order.individual_subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>
                    {language === 'en' ? 'Total (Credit Card)' : 'Total (carte de crédit)'}
                  </span>
                  <span className="text-primary">
                    ${formatPrice(order.individual_subtotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {order.kit_subtotal > 0 && order.individual_subtotal > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{language === 'en' ? 'Payment Summary' : 'Résumé du paiement'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === 'en' ? 'Kit items (billed to Head Office)' : 'Articles trousse (facturés au siège)'}
                  </span>
                  <span className="text-muted-foreground">
                    ${formatPrice(order.kit_subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {language === 'en' ? 'Individual items (credit card)' : 'Articles individuels (carte de crédit)'}
                  </span>
                  <span className="font-medium">
                    ${formatPrice(order.individual_subtotal)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>{language === 'en' ? 'Your Payment' : 'Votre paiement'}</span>
                  <span className="text-primary">${formatPrice(order.individual_subtotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
