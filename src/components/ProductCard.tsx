import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const { language, t } = useLanguage();
  const name = language === 'en' ? product.nameEn : product.nameFr;
  const description = language === 'en' ? product.descriptionEn : product.descriptionFr;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <Link to={`/product/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-secondary">
          <img
            src={product.images[0]}
            alt={name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link to={`/product/${product.id}`} className="flex-1">
            <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary line-clamp-2">
              {name}
            </h3>
          </Link>
          {product.isKit && (
            <Badge variant="kit" className="shrink-0">
              {t('product.kit')}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0">
        <div className="text-lg font-bold text-primary">
          {product.isKit ? (
            <span className="text-sm text-muted-foreground">Billed to HO</span>
          ) : (
            `$${formatPrice(product.price)}`
          )}
        </div>
        <Button size="sm" variant="outline" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {t('product.addToCart')}
        </Button>
      </CardFooter>
    </Card>
  );
};
