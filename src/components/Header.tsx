import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Globe, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { items } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(language === 'en' ? 'Logged out successfully' : 'Déconnexion réussie');
    navigate('/login');
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <span className="text-xl font-bold text-primary-foreground">TH</span>
          </div>
          <span className="hidden text-xl font-bold md:inline-block">Tim Hortons</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/store" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.store')}
          </Link>
          <Link to="/bulk-order" className="text-sm font-medium transition-colors hover:text-primary">
            {language === 'en' ? 'Bulk Order' : 'Commande en gros'}
          </Link>
          <Link to="/orders" className="text-sm font-medium transition-colors hover:text-primary">
            {t('nav.orders')}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button className="w-full" variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="h-5 w-5" />
            <span className="ml-1 text-xs font-semibold">{language.toUpperCase()}</span>
          </Button>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {language === 'en' ? 'Logout' : 'Déconnexion'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
