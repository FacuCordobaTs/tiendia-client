 import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Store, Phone, Package, DollarSign, AlertCircle } from 'lucide-react';

interface StoreData {
  name: string;
  username: string;
  phone: string;
  imageUrl?: string;
}

interface Product {
  id: number;
  name: string;
  imageURL: string;
  price?: number;
  sizes?: string;
}

function PublicStore() {
  const { username } = useParams<{ username: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        if (response.status === 404) {
          setError('Esta página no existe');
        } else {
          setError('Error al cargar la tienda');
        }
        return;
      }

      const data = await response.json();
      setStore(data.store);
      setProducts(data.products);
    } catch (error) {
      console.error('Error fetching store data:', error);
      setError('Error al cargar la tienda');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPhoneNumber = (phone: string) => {
    // Remove any existing formatting and format consistently
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('54')) {
      return `+${cleanPhone.slice(0, 2)} ${cleanPhone.slice(2, 4)} ${cleanPhone.slice(4, 6)} ${cleanPhone.slice(6, 10)}-${cleanPhone.slice(10)}`;
    }
    return phone;
  };

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

  if (!store) {
    return null;
  }

  return (
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
                  <span className="text-sm md:text-base">{formatPhoneNumber(store.phone)}</span>
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
                Explora nuestra colección de productos. Para realizar un pedido, contáctanos por WhatsApp.
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
                    className="bg-white dark:bg-gray-800 rounded-2xl p-3 md:p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Product Image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-3 md:mb-4">
                      <img
                        src={product.imageURL}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg leading-tight">
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

                      {product.sizes && (
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(product.sizes).slice(0, 3).map((size: any, index: number) => (
                            <span 
                              key={index} 
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-lg text-gray-600 dark:text-gray-300"
                            >
                              {size.name}
                            </span>
                          ))}
                          {JSON.parse(product.sizes).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded-lg text-gray-600 dark:text-gray-300">
                              +{JSON.parse(product.sizes).length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const message = `Hola! Me interesa el producto "${product.name}"${product.price ? ` - ${formatPrice(product.price)}` : ''}`;
                          const whatsappUrl = `https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                          window.open(whatsappUrl, '_blank');
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 md:px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                      >
                        <Phone className="h-4 w-4" />
                        Consultar por WhatsApp
                      </button>
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

            {/* Contact Section */}
            <div className="mt-8 md:mt-12 bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  ¿Te gustó algún producto?
                </h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                  Contáctanos por WhatsApp para realizar tu pedido
                </p>
                <button
                  onClick={() => {
                    const message = `Hola! Me interesa hacer un pedido en ${store.name}`;
                    const whatsappUrl = `https://wa.me/${store.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 md:py-3 px-4 md:px-6 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 mx-auto text-sm md:text-base"
                >
                  <Phone className="h-4 w-4 md:h-5 md:w-5" />
                  Contactar por WhatsApp
                </button>
              </div>
            </div>

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
  );
}

export default PublicStore; 