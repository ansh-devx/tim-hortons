import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Package, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

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
  stores?: {
    name: string;
  };
}

export default function Orders() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadOrders();
    loadStores();
  }, [user, navigate]);

  const loadStores = async () => {
    try {
      const { data: userStores, error } = await supabase
        .from('user_stores')
        .select('store_id, stores(id, name)')
        .eq('user_id', user?.id);

      if (error) throw error;

      const storesList = userStores
        ?.map(us => us.stores)
        .filter(Boolean) as Array<{ id: string; name: string }>;

      setStores(storesList || []);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores(name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Failed to load orders');
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

  const filteredOrders = selectedStore === 'all'
    ? orders
    : orders.filter(order => order.store_id === selectedStore);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 px-4">
          <div className="text-center text-muted-foreground">
            {language === 'en' ? 'Loading orders...' : 'Chargement des commandes...'}
          </div>
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
              {t('nav.orders')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {language === 'en'
                ? 'View and track your orders'
                : 'Voir et suivre vos commandes'}
            </p>
          </div>

          <div className="flex gap-4">
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'en' ? 'All Stores' : 'Tous les magasins'}
                </SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => navigate('/bulk-order')}>
              {language === 'en' ? 'New Order' : 'Nouvelle commande'}
            </Button>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {language === 'en'
                  ? 'No orders found'
                  : 'Aucune commande trouvée'}
              </p>
              <Button
                onClick={() => navigate('/bulk-order')}
                className="mt-4"
              >
                {language === 'en' ? 'Create Order' : 'Créer une commande'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-0 shadow-md bg-gradient-to-r from-white to-gray-50"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-1 bg-red-600 rounded-full flex-shrink-0"></div>
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                          {order.order_number}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Package className="h-4 w-4 text-blue-600" />
                          </div>
                          <p className="text-lg font-semibold text-gray-700">
                            {order.stores?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">
                            {formatDateTime(order.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 lg:items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {language === 'en' ? 'Order:' : 'Commande:'}
                        </span>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                          {language === 'en' ? 'Payment:' : 'Paiement:'}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Package className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-800">
                            {language === 'en' ? 'Kit Items' : 'Articles trousse'}
                          </p>
                          <p className="text-lg font-bold text-yellow-900">
                            {order.kit_subtotal > 0
                              ? language === 'en'
                                ? 'Billed to HO'
                                : 'Facturé au siège'
                              : language === 'en' ? 'None' : 'Aucun'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800">
                            {language === 'en' ? 'Individual Items' : 'Articles individuels'}
                          </p>
                          <p className="text-lg font-bold text-blue-900">
                            ${formatPrice(order.individual_subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <img src="/credit-card.svg" alt="Credit card" className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            {language === 'en' ? 'Your Payment' : 'Votre paiement'}
                          </p>
                          <p className="text-lg font-bold text-green-900">
                            {order.individual_subtotal === 0 ? (
                              language === 'en' ? 'No Payment' : 'Aucun paiement'
                            ) : (
                              `$${formatPrice(order.individual_subtotal)}`
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {order.kit_subtotal > 0 && order.individual_subtotal > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {language === 'en'
                            ? 'Kit items (billed to Head Office)'
                            : 'Articles trousse (facturés au siège)'}
                        </span>
                        <span className="text-muted-foreground">
                          ${formatPrice(order.kit_subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-muted-foreground">
                          {language === 'en'
                            ? 'Individual items (credit card)'
                            : 'Articles individuels (carte de crédit)'}
                        </span>
                        <span className="font-medium">
                          ${formatPrice(order.individual_subtotal)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
