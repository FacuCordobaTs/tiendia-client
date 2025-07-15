import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router';
import { Store, Phone, Package, DollarSign, AlertCircle, ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import toast, { Toaster } from 'react-hot-toast';

// --- Interfaces ---
interface StoreData {
  name: string;
  username: string;
  phone: string;
  imageUrl?: string;
}

interface ProductSize {
    name: string;
    stock: number;
}

interface Product {
  id: number;
  name: string;
  imageURL: string;
  price?: number;
  sizes?: string; // Raw JSON string from API
  storeImageURLs?: string; // Raw JSON string from API
}

interface CartItem extends Product {
    quantity: number;
    selectedSize: ProductSize | null;
}

// --- Main Component ---
function PublicStore() {
  const { username } = useParams<{ username: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Cart State ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // --- Size Selection Modal State ---
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [productForSizeSelection, setProductForSizeSelection] = useState<Product | null>(null);


  useEffect(() => {
    if (username) {
      fetchStoreData();
    }
  }, [username]);

  const fetchStoreData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`https://api.tiendia.app/api/auth/store/${username}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Esta página no existe' : 'Error al cargar la tienda');
      }
      const data = await response.json();
      setStore(data.store);
      setProducts(data.products);
    } catch (err: any) {
      console.error('Error fetching store data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Cart Logic ---
  const addToCart = (product: Product, size: ProductSize | null) => {
    setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(
            item => item.id === product.id && item.selectedSize?.name === size?.name
        );

        if (existingItemIndex > -1) {
            // Update quantity of existing item
            const updatedCart = [...prevCart];
            updatedCart[existingItemIndex].quantity += 1;
            return updatedCart;
        } else {
            // Add new item to cart
            return [...prevCart, { ...product, quantity: 1, selectedSize: size }];
        }
    });
    toast.success(`${product.name} añadido al carrito!`);
  };

  const updateQuantity = (productId: number, sizeName: string | null, newQuantity: number) => {
    setCart(prevCart => {
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            return prevCart.filter(item => !(item.id === productId && item.selectedSize?.name === sizeName));
        }
        return prevCart.map(item => 
            item.id === productId && item.selectedSize?.name === sizeName
                ? { ...item, quantity: newQuantity }
                : item
        );
    });
  };

  const removeFromCart = (productId: number, sizeName: string | null) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && item.selectedSize?.name === sizeName)));
    toast.error("Producto eliminado del carrito.");
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price || 0) * item.quantity, 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);


  // --- Event Handlers ---
  const handleAddToCartClick = (product: Product) => {
    const availableSizes = product.sizes ? JSON.parse(product.sizes) : [];
    if (availableSizes.length > 0) {
        setProductForSizeSelection(product);
        setIsSizeModalOpen(true);
    } else {
        addToCart(product, null);
    }
  };

  const handleSizeSelected = (size: ProductSize) => {
    if (productForSizeSelection) {
        addToCart(productForSizeSelection, size);
    }
    setIsSizeModalOpen(false);
    setProductForSizeSelection(null);
  };

  const generateWhatsAppMessage = () => {
    if (!store) return;
    let message = `Hola! 👋 Quisiera hacer el siguiente pedido en *${store.name}*:\n\n`;
    
    cart.forEach(item => {
        const priceText = item.price ? ` - ${formatPrice(item.price)}` : '';
        const sizeText = item.selectedSize ? ` (Talle: ${item.selectedSize.name})` : '';
        message += `• ${item.name}${sizeText} x ${item.quantity}${priceText}\n`;
    });

    message += `\n*Total: ${formatPrice(cartTotal)}*`;

    const whatsappUrl = `https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  // --- Helper Functions ---
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
  };
  
  // --- Render Logic ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-50 animate-pulse"></div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Cargando tienda...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Página no encontrada</h1>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }
  if (!store) { return null; }

  return (
    <>
      <Toaster position="bottom-center" />
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 overflow-auto">
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                  {store.imageUrl && (
                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <img 
                        src={store.imageUrl} 
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 break-all">my.tiendia.app/u/{store.username}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm md:text-base">{store.phone}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
              {/* Store Info Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 md:mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                    <Store className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Bienvenido a {store.name}</h2>
                </div>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                  Explora nuestra colección de productos. ¡Ahora puedes armar tu pedido y enviarlo por WhatsApp!
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    <span>{products.length} productos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Pedidos por WhatsApp</span>
                  </div>
                </div>
              </div>
              {/* Products Grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 flex flex-col"
                    >
                      {/* Carousel for product images */}
                      {(() => {
                        let imageUrls: string[] = [];
                        try {
                          imageUrls = product.storeImageURLs ? JSON.parse((product as any).storeImageURLs) : [];
                        } catch (e) {
                          imageUrls = [];
                        }
                        if (imageUrls.length === 0) {
                          imageUrls = [product.imageURL];
                        }
                        return (
                          <Carousel className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-3 md:mb-4 group">
                            <CarouselContent>
                              {imageUrls.map((url, index) => (
                                <CarouselItem key={index}>
                                  <div className="aspect-square w-full">
                                    <img
                                      src={url}
                                      alt={`${product.name} ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </CarouselItem>
                              ))}
                            </CarouselContent>
                            {imageUrls.length > 1 && (
                              <>
                                <CarouselPrevious className="absolute left-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CarouselNext className="absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </>
                            )}
                          </Carousel>
                        );
                      })()}
                      {/* Product Info */}
                      <div className="space-y-3 flex-1 flex flex-col">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg leading-tight flex-1">
                          {product.name}
                        </h3>
                        {product.price && product.price > 0 && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        )}
                        {product.sizes && JSON.parse(product.sizes).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {JSON.parse(product.sizes).slice(0, 5).map((size: ProductSize, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-lg text-gray-600 dark:text-gray-300">
                                {size.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <Button
                          onClick={() => handleAddToCartClick(product)}
                          className="w-full mt-auto bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 md:px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Añadir al carrito
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 md:py-16">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay productos disponibles
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                    Esta tienda aún no tiene productos publicados.
                  </p>
                </div>
              )}
              {/* Footer */}
              <div className="mt-6 md:mt-8 text-center">
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                  Powered by <span className="font-medium">tiendia.app</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- Floating Cart Button --- */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsCartOpen(true)}
          className="rounded-full h-16 w-16 bg-purple-600 hover:bg-purple-700 shadow-lg relative"
        >
          <ShoppingCart className="h-7 w-7" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </Button>
      </div>
      {/* --- Cart Drawer --- */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      >
        <div 
          className={`fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl flex flex-col transition-transform duration-300 ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold">Tu Carrito</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCartOpen(false)}><X/></Button>
          </div>
          {cart.length > 0 ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.map(item => (
                  <div key={`${item.id}-${item.selectedSize?.name}`} className="flex items-center gap-4">
                    <img src={item.imageURL} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold">{item.name}</p>
                      {item.selectedSize && <p className="text-sm text-gray-500">Talle: {item.selectedSize.name}</p>}
                      <p className="font-bold text-purple-600">{formatPrice(item.price || 0)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.selectedSize?.name || null, item.quantity - 1)}><Minus className="h-4 w-4"/></Button>
                        <span>{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.selectedSize?.name || null, item.quantity + 1)}><Plus className="h-4 w-4"/></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeFromCart(item.id, item.selectedSize?.name || null)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={generateWhatsAppMessage}>
                  Finalizar Compra por WhatsApp
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <ShoppingCart className="h-20 w-20 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold">Tu carrito está vacío</h3>
              <p className="text-gray-500">Añade productos para verlos aquí.</p>
            </div>
          )}
        </div>
      </div>
      {/* --- Size Selection Modal --- */}
      {isSizeModalOpen && productForSizeSelection && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setIsSizeModalOpen(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold mb-4">Selecciona un talle para</h3>
                <p className="font-bold text-purple-600 mb-6">{productForSizeSelection.name}</p>
                <div className="flex flex-wrap gap-3">
                    {JSON.parse(productForSizeSelection.sizes || '[]').map((size: ProductSize) => (
                        <Button
                            key={size.name}
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleSizeSelected(size)}
                        >
                            {size.name}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
      )}
    </>
  );
}

export default PublicStore; 