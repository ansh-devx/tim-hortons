import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, Globe, LogOut, Menu, Store, Package, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useState } from 'react';

export const Header = () => {
  const { language, setLanguage, t } = useLanguage();
  const { items } = useCart();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success(language === 'en' ? 'Logged out successfully' : 'Déconnexion réussie');
    navigate('/login');
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Helper function to determine if a route is active
  const isActiveRoute = (path: string) => {
    if (path === '/store' && (location.pathname === '/' || location.pathname === '/store')) {
      return true;
    }
    return location.pathname === path;
  };

  // Helper function to get navigation link classes
  const getNavLinkClasses = (path: string) => {
    const baseClasses = "text-sm font-medium px-3 py-2 rounded transition-colors";
    const activeClasses = "bg-white text-red-600";
    const inactiveClasses = "text-white hover:bg-white hover:text-red-600";

    return `${baseClasses} ${isActiveRoute(path) ? activeClasses : inactiveClasses}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-red-600 backdrop-blur supports-[backdrop-filter]:bg-red-600/95">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left: Logo + Hamburger Menu (Mobile) */}
        <div className="flex items-center gap-2">
          {/* Hamburger Menu - Mobile Only */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white hover:text-red-600">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Link
                  to="/store"
                  className="flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Store className="h-5 w-5" />
                  {t('nav.store')}
                </Link>
                <Link
                  to="/bulk-order"
                  className="flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Package className="h-5 w-5" />
                  {language === 'en' ? 'Bulk Order' : 'Commande en gros'}
                </Link>
                <Link
                  to="/orders"
                  className="flex items-center gap-3 text-lg font-medium transition-colors hover:text-primary py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="h-5 w-5" />
                  {t('nav.orders')}
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/tim-hortons.svg"
              alt="Tim Hortons Logo"
              className="h-8 object-contain"
            />
          </Link>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/store" className={getNavLinkClasses('/store')}>
            {t('nav.store')}
          </Link>
          <Link to="/bulk-order" className={getNavLinkClasses('/bulk-order')}>
            {language === 'en' ? 'Bulk Order' : 'Commande en gros'}
          </Link>
          <Link to="/orders" className={getNavLinkClasses('/orders')}>
            {t('nav.orders')}
          </Link>
        </nav>

        {/* Right: Language, Cart, User */}
        <div className="flex items-center gap-2">
          <Button className="w-full text-white hover:bg-white hover:text-red-600" variant="ghost" size="icon" onClick={toggleLanguage}>
            <Globe className="h-5 w-5" />
            <span className="ml-1 text-xs font-semibold">{language.toUpperCase()}</span>
          </Button>

          <Link to="/cart">
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-white hover:text-red-600">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-yellow-500 text-black"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white hover:text-red-600">
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
              <Button variant="ghost" size="icon" className="text-white hover:bg-white hover:text-red-600">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
