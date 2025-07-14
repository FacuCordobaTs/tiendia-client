import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useProduct } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, DollarSign, Save, RefreshCw, CheckCircle, AlertCircle, Plus, X, Package } from 'lucide-react';
import toast from 'react-hot-toast';

interface Size {
  id: string;
  name: string;
  stock: number;
}

interface ProductWithPrice {
  id: number;
  name: string;
  imageURL: string;
  createdAt: Date;
  createdBy: number;
  price?: number;
  isPriceSet: boolean;
  sizes: Size[];
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
        price: product.price ?? undefined, // Convert null to undefined
        isPriceSet: product.price !== undefined && product.price !== null,
        sizes: product.sizes ? JSON.parse(product.sizes) : []
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

  const addSize = (productId: number) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              sizes: [...product.sizes, { id: Date.now().toString(), name: '', stock: 0 }]
            }
          : product
      )
    );
    setHasChanges(true);
  };

  const removeSize = (productId: number, sizeId: string) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              sizes: product.sizes.filter(size => size.id !== sizeId)
            }
          : product
      )
    );
    setHasChanges(true);
  };

  const updateSize = (productId: number, sizeId: string, field: 'name' | 'stock', value: string | number) => {
    setProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { 
              ...product, 
              sizes: product.sizes.map(size => 
                size.id === sizeId 
                  ? { ...size, [field]: field === 'stock' ? Math.max(0, parseInt(value as string) || 0) : value }
                  : size
              )
            }
          : product
      )
    );
    setHasChanges(true);
  };

  const handleSavePrices = async () => {
    setIsSaving(true);
    try {
      // Prepare products data for API - only include products with valid prices
      const productsToUpdate = products
        .filter(product => product.price !== null && product.price !== undefined && product.price > 0)
        .map(product => ({
        id: product.id,
          price: product.price as number, // Type assertion since we filtered out null/undefined
        sizes: product.sizes
      }));

      // Call the update-pricing API endpoint
      const response = await fetch('https://api.tiendia.app/api/products/update-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ products: productsToUpdate })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log(errorData);
        throw new Error(errorData.error || 'Error al guardar los precios');
      }

      toast.success('¡Precios guardados con éxito!');
      setHasChanges(false);

      navigate('/pay-mi-tiendia')
    } catch (error: any) {
      console.error('Error saving prices:', error);
      toast.error(error.message || 'Error al guardar los precios');
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
                onClick={() => navigate('/mi-tiendia')}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">Con Talles</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {products.filter(p => p.sizes.length > 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Stock Total</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {products.reduce((total, product) => 
                    total + product.sizes.reduce((sum, size) => sum + size.stock, 0), 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
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
                      className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80"
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

                {/* Sizes and Stock Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      Talles y Stock
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSize(product.id)}
                      className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar Talle
                    </Button>
                  </div>

                  {product.sizes.length === 0 ? (
                    <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                        No hay talles configurados
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Agrega talles para gestionar el stock
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {product.sizes.map((size) => (
                        <div key={size.id} className="group relative p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Talle
                              </label>
                              <Input
                                type="text"
                                value={size.name}
                                onChange={(e) => updateSize(product.id, size.id, 'name', e.target.value)}
                                placeholder="Ej: S, M, L, 31, 32..."
                                className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Stock
                              </label>
                              <Input
                                type="number"
                                value={size.stock}
                                onChange={(e) => updateSize(product.id, size.id, 'stock', e.target.value)}
                                placeholder="0"
                                min="0"
                                className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 text-center"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSize(product.id, size.id)}
                              className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total Stock Summary */}
                  {product.sizes.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                            Stock Total
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {product.sizes.length} talle{product.sizes.length !== 1 ? 's' : ''} configurado{product.sizes.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                            {product.sizes.reduce((total, size) => total + size.stock, 0)}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            unidades
                          </p>
                        </div>
                      </div>
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
            💡 Consejos para configurar tu catálogo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Precios
              </h4>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-medium mb-1">• Investiga la competencia</p>
                  <p>Revisa precios de productos similares en el mercado</p>
                </div>
                <div>
                  <p className="font-medium mb-1">• Considera tus costos</p>
                  <p>Incluye costos de producción, envío y ganancia</p>
                </div>
                <div>
                  <p className="font-medium mb-1">• Factor psicológico</p>
                  <p>Los precios terminados en 9 o 99 suelen ser más atractivos</p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                Talles y Stock
              </h4>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div>
                  <p className="font-medium mb-1">• Usa talles estándar</p>
                  <p>S, M, L, XL para ropa o números específicos como 31, 32, 33</p>
                </div>
                <div>
                  <p className="font-medium mb-1">• Controla el inventario</p>
                  <p>Actualiza el stock regularmente para evitar ventas sin stock</p>
                </div>
                <div>
                  <p className="font-medium mb-1">• Stock mínimo</p>
                  <p>Mantén un stock mínimo para productos populares</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductPricingPage; 