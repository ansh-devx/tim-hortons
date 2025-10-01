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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/-/g, '/'); // Convert YYYY-MM-DD to YYYY/MM/DD

    const timeStr = date.toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return `${dateStr} at ${timeStr}`;
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

        <Card className="mb-8 shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
          <CardHeader className="pb-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-12 w-1 bg-red-600 rounded-full"></div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-gray-900">
                      {order.order_number}
                    </CardTitle>
                    <p className="text-lg text-gray-600 mt-1 font-medium">
                      {order.stores?.name}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {language === 'en' ? 'Order Status:' : 'État commande:'}
                  </span>
                  {getStatusBadge(order.order_status)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-600">
                    {language === 'en' ? 'Payment Status:' : 'État paiement:'}
                  </span>
                  {order.individual_subtotal === 0 ? (
                    <Badge className="bg-green-500 text-white">
                      {language === 'en' ? 'N/A (Billed to HO)' : 'S/O (Facturé au siège)'}
                    </Badge>
                  ) : (
                    getPaymentBadge(order.payment_status)
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {language === 'en' ? 'Order Date & Time' : 'Date et heure'}
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">
                      {language === 'en' ? 'Total Items' : 'Total articles'}
                    </p>
                    <p className="text-lg font-bold text-purple-900">
                      {orderItems.reduce((sum, item) => sum + item.quantity, 0)} {language === 'en' ? 'items' : 'articles'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      {language === 'en' ? 'Your Payment' : 'Votre paiement'}
                    </p>
                    <p className="text-lg font-bold text-green-900">
                      {order.individual_subtotal === 0 ? (
                        language === 'en' ? 'Billed to HO' : 'Facturé au siège'
                      ) : (
                        `$${formatPrice(order.individual_subtotal)}`
                      )}
                    </p>
                  </div>
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
          <Card className="mb-8 shadow-md border-l-4 border-l-red-600">
            <CardHeader className="bg-red-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-red-800">
                    {language === 'en' ? 'Kit Items' : 'Articles trousse'}
                  </CardTitle>
                  <p className="text-sm text-red-600 font-medium">
                    {language === 'en' ? 'Billed to Head Office' : 'Facturé au siège'}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-300">
                    {kitItems.length} {language === 'en' ? 'kit(s)' : 'trousse(s)'}
                  </Badge>
                </div>
              </div>
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
          <Card className="mb-8 shadow-md border-l-4 border-l-blue-600">
            <CardHeader className="bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-blue-800">
                    {language === 'en' ? 'Individual Items' : 'Articles individuels'}
                  </CardTitle>
                  <p className="text-sm text-blue-600 font-medium">
                    {language === 'en' ? 'Credit Card Payment' : 'Paiement par carte'}
                  </p>
                </div>
                <div className="ml-auto">
                  <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                    {individualItems.length} {language === 'en' ? 'item(s)' : 'article(s)'}
                  </Badge>
                </div>
              </div>
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
