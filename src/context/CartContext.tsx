// context/CartContext.tsx
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback,
  useMemo
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';


// 📋 1. ÉNUMÉRATION DES STATUTS DE PRODUCTION (Source unique de vérité)
export enum DailyMenuStatus {
  WAITING_FIRST_ORDER = 'WAITING_FIRST_ORDER', // En attente du pack de lancement
  PRODUCTION_CONFIRMED = 'PRODUCTION_CONFIRMED', // Seuil atteint, ouvert aux portions
  PRODUCTION_CLOSED = 'PRODUCTION_CLOSED',      // Clôturé (heure limite ou rupture)
}

export type CartMode = 'pack' | 'portion';

// 🍎 2. LE CATALOGUE PUR (Statique, intemporel, sans logique métier)
export interface Product {
  id: string | number;
  name: string;
  price: number; // Prix catalogue de référence (pour info seulement)
  description?: string;
  category?: string;
  image?: string;
  emoji?: string;
  available?: boolean;
}

// 🍲 3. LA PRODUCTION TEMPORELLE (Dynamique, logistique, source de vérité)
export interface DailyMenu {
  id: string;              // ID unique de la session de production
  product: Product;        // Référence au produit du catalogue
  status: DailyMenuStatus; // État actuel de la production
  packPrice: number;       // Prix du pack pour CETTE session
  portionPrice: number;    // Prix unitaire pour CETTE session
  minimumProduction: number; // Seuil de déclenchement (ex: 3 portions)
  reservedPortions: number; // Compteur dynamique actuel
  launchCustomer?: string;  // ID du pionnier qui a lancé (optionnel)
  launchDate?: string;      // Date de lancement effectif
  cutoffTime?: string;      // Heure limite de commande
  deliveryDate?: string;    // Date ciblée de livraison
}

// 🛒 4. L'ITEM DU PANIER : Clair, explicite, prêt pour l'UI
export interface CartItem {
  id: string | number;   // ID du produit (pour regroupement catalogue)
  menuId: string;        // ID de la session DailyMenu (pour traçabilité)
  name: string;          // Nom du produit (copié pour affichage rapide)
  image?: string;        // URL image (copiée pour affichage)
  mode: CartMode;        // 'pack' ou 'portion'
  quantity: number;      // Quantité commandée
  appliedPrice: number;  // Prix réel facturé (packPrice ou portionPrice)
  unitLabel: string;     // ✅ Libellé explicite pour l'UI : "Pack (3 portions)"
  addedAt: string;       // Timestamp d'ajout
}

export interface CartContextType {
  // État
  cart: CartItem[];
  isLoading: boolean;
  
  // Actions
  addToCart: (menu: DailyMenu, quantity?: number, mode?: CartMode) => void;
  removeFromCart: (productId: string | number, mode?: CartMode) => void;
  updateQuantity: (productId: string | number, quantity: number, mode?: CartMode) => void;
  clearCart: () => void;
  clearModeFromCart: (mode: CartMode) => void;
  
  // Queries
  isInCart: (productId: string | number, mode?: CartMode) => boolean;
  getCartItem: (productId: string | number, mode?: CartMode) => CartItem | undefined;
  getItemsByMode: (mode: CartMode) => CartItem[];
  
  // Calculs financiers
  getTotal: () => number;
  getTotalByMode: (mode: CartMode) => number;
  getItemCount: () => number;
  getItemCountByMode: (mode: CartMode) => number;
  getPackSubtotal: () => number;
  getPortionSubtotal: () => number;
}

const CART_STORAGE_KEY = '@kemtchop:cart:v4';
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 Chargement du stockage persistant au montage
  useEffect(() => {
    const loadCart = async () => {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Filtrage de sécurité : ne garder que les items valides
            setCart(parsed.filter((item: any) => item?.id && item?.menuId && item?.mode));
          }
        }
      } catch (error) {
        console.warn('[CartContext] Échec chargement panier:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  // 💾 Sauvegarde automatique debouncée (300ms)
  useEffect(() => {
    if (isLoading) return;
    
    const saveCart = async () => {
      try {
        await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      } catch (error) {
        console.warn('[CartContext] Échec sauvegarde panier:', error);
      }
    };
    
    const timer = setTimeout(saveCart, 300);
    return () => clearTimeout(timer);
  }, [cart, isLoading]);

  // ➕ AJOUT AU PANIER (Signature stricte : uniquement DailyMenu)
  const addToCart = useCallback((
    menu: DailyMenu, 
    quantity: number = 1, 
    mode?: CartMode
  ) => {
    // 🎯 Détermination automatique du mode selon le statut de production
    // Si WAITING_FIRST_ORDER → on force le mode 'pack' (logique métier)
    const cartMode = mode || (menu.status === DailyMenuStatus.WAITING_FIRST_ORDER ? 'pack' : 'portion');
    
    // 💰 Attribution du prix et du libellé selon le mode
    const appliedPrice = cartMode === 'pack' ? menu.packPrice : menu.portionPrice;
    const unitLabel = cartMode === 'pack' 
      ? `Pack Lancement (${menu.minimumProduction} portions)` 
      : 'Portion individuelle';

    setCart(prev => {
      // Recherche d'un item existant avec même produit ET même mode
      const existingIndex = prev.findIndex(
        item => item.id === menu.product.id && item.mode === cartMode
      );

      if (existingIndex >= 0) {
        // Mise à jour de quantité avec ré-évaluation du prix (sécurité)
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          appliedPrice, // ✅ Prix mis à jour si tarif a changé entre-temps
          unitLabel,    // ✅ Libellé synchronisé
          menuId: menu.id, // ✅ Recouplage à la dernière instance de production
          addedAt: new Date().toISOString(),
        };
        return updated;
      }

      // ✅ Création d'un CartItem "aplati" et documenté pour l'UI
      const newItem: CartItem = {
        id: menu.product.id,      // ID catalogue pour regroupement
        menuId: menu.id,          // ID session pour traçabilité logistique
        name: menu.product.name,  // Copie pour affichage rapide sans jointure
        image: menu.product.image,
        mode: cartMode,
        quantity,
        appliedPrice,
        unitLabel,                // ✅ Libellé explicite : plus de confusion UI
        addedAt: new Date().toISOString(),
      };

      return [...prev, newItem];
    });
  }, []);

  // ➖ Retirer du panier
  const removeFromCart = useCallback((productId: string | number, mode?: CartMode) => {
    setCart(prev => {
      if (mode) {
        // Suppression ciblée par mode
        return prev.filter(item => !(item.id === productId && item.mode === mode));
      }
      // Suppression globale du produit (tous modes)
      return prev.filter(item => item.id !== productId);
    });
  }, []);

  // ✏️ Mettre à jour la quantité
  const updateQuantity = useCallback((
    productId: string | number, 
    quantity: number, 
    mode?: CartMode
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, mode);
      return;
    }
    
    setCart(prev => prev.map(item => {
      if (item.id === productId && (!mode || item.mode === mode)) {
        return { ...item, quantity };
      }
      return item;
    }));
  }, [removeFromCart]);

  // 🗑️ Actions de nettoyage
  const clearCart = useCallback(() => setCart([]), []);
  
  const clearModeFromCart = useCallback((mode: CartMode) => {
    setCart(prev => prev.filter(item => item.mode !== mode));
  }, []);

  // 🔍 Queries
  const isInCart = useCallback((productId: string | number, mode?: CartMode): boolean => {
    return cart.some(item => item.id === productId && (!mode || item.mode === mode));
  }, [cart]);

  const getCartItem = useCallback((productId: string | number, mode?: CartMode): CartItem | undefined => {
    return cart.find(item => item.id === productId && (!mode || item.mode === mode));
  }, [cart]);

  const getItemsByMode = useCallback((mode: CartMode): CartItem[] => {
    return cart.filter(item => item.mode === mode);
  }, [cart]);

  // 💰 Calculs financiers (avec mémoïsation implicite via useCallback)
  const getTotal = useCallback((): number => {
    return cart.reduce((total, item) => total + (item.appliedPrice * item.quantity), 0);
  }, [cart]);

  const getTotalByMode = useCallback((mode: CartMode): number => {
    return cart
      .filter(item => item.mode === mode)
      .reduce((total, item) => total + (item.appliedPrice * item.quantity), 0);
  }, [cart]);

  const getItemCount = useCallback((): number => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const getItemCountByMode = useCallback((mode: CartMode): number => {
    return cart
      .filter(item => item.mode === mode)
      .reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  // 🎁 Helpers métier pour l'UI
  const getPackSubtotal = useCallback((): number => getTotalByMode('pack'), [getTotalByMode]);
  const getPortionSubtotal = useCallback((): number => getTotalByMode('portion'), [getTotalByMode]);

  // 🎯 Valeur du contexte (mémoïsée pour éviter les re-renders inutiles)
  const value = useMemo((): CartContextType => ({
    cart,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearModeFromCart,
    isInCart,
    getCartItem,
    getItemsByMode,
    getTotal,
    getTotalByMode,
    getItemCount,
    getItemCountByMode,
    getPackSubtotal,
    getPortionSubtotal,
  }), [
    cart, isLoading, addToCart, removeFromCart, updateQuantity, 
    clearCart, clearModeFromCart, isInCart, getCartItem, getItemsByMode,
    getTotal, getTotalByMode, getItemCount, getItemCountByMode,
    getPackSubtotal, getPortionSubtotal,
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// 🪝 Hook personnalisé avec vérification de contexte
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;