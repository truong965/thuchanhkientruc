import React from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import type { Product } from '../api';

interface ProductCardProps {
  product: Product;
  stock: number;
  onAddToCart: (p: Product) => void;
  isAdding: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, stock, onAddToCart, isAdding }) => {
  const getStockClass = () => {
    if (stock <= 0) return 'low';
    if (stock <= 5) return 'med';
    return 'high';
  };

  const getImageName = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('iphone')) return 'iphone15promax.png';
    if (n.includes('samsung')) return 's24ultra.png';
    if (n.includes('macbook')) return 'macbookprom3.png';
    if (n.includes('sony')) return 'sonywh1000xm5.png';
    return '';
  };

  const imageSrc = new URL(`../assets/${getImageName(product.name)}`, import.meta.url).href;

  return (
    <div className="product-card">
      <div className="image-container">
        <img src={imageSrc} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">${product.price}</p>
        
        <div className="stock-info">
          <div className={`stock-tag ${getStockClass()}`}>
            <Package size={14} />
            <span>{stock > 0 ? `${stock} in stock` : 'Out of stock'}</span>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => onAddToCart(product)}
          disabled={stock <= 0 || isAdding}
        >
          <ShoppingCart size={18} />
          {isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};
