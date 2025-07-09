import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, DollarSign, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductWithPrice {
  id: number;
  name: string;
  imageURL: string;
  createdAt: Date;
  createdBy: number;
  price?: number;
  isPriceSet: boolean;
}

function ProductPricingPage() {
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const navigate = useNavigate();
  const { getProducts, products: contextProducts } = useProduct();

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    // Transform context products to include price functionality
    if (contextProducts.length > 0) {
      const productsWithPrices: ProductWithPrice[] = contextProducts.map(product => ({
        ...product,
        price: undefined, // Will be set by user
        isPriceSet: false
      }));
      setProducts(productsWithPrices);
      setIsLoading(false);
    }
  }, [contextProducts]);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      await getProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Error al cargar los productos');
      setIsLoading(false);
    }
  };

  const handlePriceChange = (productId: number, newPrice: string) => {
    const numericPrice = parseFloat(newPrice) || 0;
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              price: numericPrice,
              isPriceSet: numericPrice > 0
            }
          : product
      )
    );
    setHasChanges(true);
  };

  const handleSavePrices = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save prices
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('¡Precios guardados con éxito!');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving prices:', error);
      toast.error('Error al guardar los precios');
    } finally {
      setIsSaving(false);
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

  const getProductsWithoutPrice = () => {
    return products.filter(product => !product.isPriceSet);
  };

  const getProductsWithPrice = () => {
    return products.filter(product => product.isPriceSet);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-50 animate-pulse"></div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home')}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Configurar Precios
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Establece precios para tus productos
                </p>
              </div>
            </div>
            
            {hasChanges && (
              <Button
                onClick={handleSavePrices}
                disabled={isSaving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Guardar Cambios
                  </div>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{products.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Con Precio</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{getProductsWithPrice().length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin Precio</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{getProductsWithoutPrice().length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-4">
                <img
                  src={product.imageURL}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    ID: {product.id}
                  </p>
                </div>

                {/* Price Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Precio (ARS)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="number"
                      value={product.price || ''}
                      onChange={(e) => handlePriceChange(product.id, e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
                    />
                  </div>
                  
                  {/* Price Display */}
                  {product.price && product.price > 0 && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Precio: {formatPrice(product.price)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  {product.isPriceSet ? (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Precio configurado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Sin precio</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No hay productos
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Sube productos primero para poder configurar sus precios
            </p>
            <Button
              onClick={() => navigate('/home')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              Ir a Productos
            </Button>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            💡 Consejos para fijar precios
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <p className="font-medium mb-2">• Investiga la competencia</p>
              <p>Revisa precios de productos similares en el mercado</p>
            </div>
            <div>
              <p className="font-medium mb-2">• Considera tus costos</p>
              <p>Incluye costos de producción, envío y ganancia</p>
            </div>
            <div>
              <p className="font-medium mb-2">• Factor psicológico</p>
              <p>Los precios terminados en 9 o 99 suelen ser más atractivos</p>
            </div>
            <div>
              <p className="font-medium mb-2">• Revisa regularmente</p>
              <p>Ajusta precios según la demanda y temporada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPricingPage; 