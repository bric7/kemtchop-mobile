// hooks/useCartSummary.ts
import { useCart } from '@/context/CartContext';
import { useMemo } from 'react';

export const useCartSummary = () => {
  const { cart, getTotal, getItemCount } = useCart();
  
  return useMemo(() => ({
    isEmpty: cart.length === 0,
    itemCount: getItemCount(),
    total: getTotal(),
    formattedTotal: new Intl.NumberFormat('fr-CM', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(getTotal()),
    hasPacks: cart.some(item => item.mode === 'pack'),
    hasPortions: cart.some(item => item.mode === 'portion'),
  }), [cart, getTotal, getItemCount]);
};