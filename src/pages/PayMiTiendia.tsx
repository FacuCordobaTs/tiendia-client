import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Store, CheckCircle, Smartphone, Package, MessageCircle, Link, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProduct } from '@/context/ProductContext';
import toast from 'react-hot-toast';

// Exchange rates and currency info (same as CreditsPage)
const EXCHANGE_RATES = [
    { source_currency: "USD", target_currency: "BRL", value: 6.65227 },
    { source_currency: "USD", target_currency: "CLP", value: 1083.95280 },
    { source_currency: "USD", target_currency: "COP", value: 4689.88920 },
    { source_currency: "USD", target_currency: "MXN", value: 21.85355 },
    { source_currency: "USD", target_currency: "PEN", value: 3.96795 },
    { source_currency: "USD", target_currency: "UYU", value: 47.26736 },
    { source_currency: "USD", target_currency: "ARS", value: 1320.47300 },
    { source_currency: "USD", target_currency: "PYG", value: 8281.67550 },
    { source_currency: "USD", target_currency: "BOB", value: 11.53600 },
    { source_currency: "USD", target_currency: "DOP", value: 61.52700 },
    { source_currency: "USD", target_currency: "EUR", value: 1.02940 },
    { source_currency: "USD", target_currency: "GTQ", value: 8.18511 },
    { source_currency: "USD", target_currency: "CRC", value: 536.19994 },
    { source_currency: "USD", target_currency: "MYR", value: 4.64839 },
    { source_currency: "USD", target_currency: "IDR", value: 17419.61070 },
    { source_currency: "USD", target_currency: "KES", value: 137.45974 },
    { source_currency: "USD", target_currency: "NGN", value: 2867.14850 }
];

const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
    'AR': 'ARS', 'BR': 'BRL', 'CL': 'CLP', 'CO': 'COP', 'MX': 'MXN', 'PE': 'PEN',
    'UY': 'UYU', 'PY': 'PYG', 'BO': 'BOB', 'DO': 'DOP', 'GT': 'GTQ', 'CR': 'CRC',
    'MY': 'MYR', 'ID': 'IDR', 'KE': 'KES', 'NG': 'NGN'
};

const CURRENCY_INFO: { [key: string]: { symbol: string, locale: string, flag: string } } = {
    'ARS': { symbol: '$', locale: 'es-AR', flag: '🇦🇷' },
    'BRL': { symbol: 'R$', locale: 'pt-BR', flag: '🇧🇷' },
    'CLP': { symbol: '$', locale: 'es-CL', flag: '🇨🇱' },
    'COP': { symbol: '$', locale: 'es-CO', flag: '🇨🇴' },
    'MXN': { symbol: '$', locale: 'es-MX', flag: '🇲🇽' },
    'PEN': { symbol: 'S/', locale: 'es-PE', flag: '🇵🇪' },
    'UYU': { symbol: '$', locale: 'es-UY', flag: '🇺🇾' },
    'PYG': { symbol: '₲', locale: 'es-PY', flag: '🇵🇾' },
    'BOB': { symbol: 'Bs', locale: 'es-BO', flag: '🇧🇴' },
    'DOP': { symbol: 'RD$', locale: 'es-DO', flag: '🇩🇴' },
    'GTQ': { symbol: 'Q', locale: 'es-GT', flag: '🇬🇹' },
    'CRC': { symbol: '₡', locale: 'es-CR', flag: '🇨🇷' },
    'MYR': { symbol: 'RM', locale: 'ms-MY', flag: '🇲🇾' },
    'IDR': { symbol: 'Rp', locale: 'id-ID', flag: '🇮🇩' },
    'KES': { symbol: 'KSh', locale: 'en-KE', flag: '🇰🇪' },
    'NGN': { symbol: '₦', locale: 'en-NG', flag: '🇳🇬' },
    'USD': { symbol: '$', locale: 'en-US', flag: '🇺🇸' },
    'EUR': { symbol: '€', locale: 'de-DE', flag: '🇪🇺' }
};

function PayMiTiendia() {
  const [currentStep, setCurrentStep] = useState(1);
  const [userCountry, setUserCountry] = useState<string>('AR');
  const [userCurrency, setUserCurrency] = useState<string>('ARS');
  const [convertedPrice, setConvertedPrice] = useState<number>(2000);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, getProducts } = useProduct();

  useEffect(() => {
    detectUserCountry();
  }, []);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await getProducts();
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    if (userCountry) {
      const currency = COUNTRY_CURRENCY_MAP[userCountry] || 'USD';
      setUserCurrency(currency);
      convertPrice(currency);
    }
  }, [userCountry]);

  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      const country = data.country_code;
      setUserCountry(country);
    } catch (error) {
      console.log('Could not detect country automatically');
      setUserCountry('AR');
    }
  };

  const convertPrice = (currency: string) => {
    if (userCountry === 'AR') {
      setConvertedPrice(2000); // Fixed price for Argentina
      return;
    }
    
    const exchangeRate = EXCHANGE_RATES.find(rate => rate.target_currency === currency);
    if (exchangeRate) {
      setConvertedPrice(Math.round(2 * exchangeRate.value * 100) / 100);
    } else {
      setConvertedPrice(2); // Default to USD
    }
  };

  const formatPrice = (price: number, currency: string) => {
    const currencyInfo = CURRENCY_INFO[currency];
    if (!currencyInfo) {
      return `${currency} ${price.toFixed(2)}`;
    }

    if (currency === 'ARS') {
      return `${currencyInfo.symbol}${price.toLocaleString(currencyInfo.locale)}`;
    }

    return `${currencyInfo.symbol}${price.toLocaleString(currencyInfo.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const getPaymentProviderName = () => {
    return userCountry === 'AR' ? 'Mercado Pago' : 'dLocal';
  };

  const handlePurchase = async () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (userCountry === 'AR') {
        // Mercado Pago flow
        response = await fetch('https://api.tiendia.app/api/payments/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credits: convertedPrice }),
        });
      } else {
        // dLocal flow
        response = await fetch('https://api.tiendia.app/api/payments/create-dlocal-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credits: 2 }), // 2 USD
        });
      }

      if (!response.ok) {
        throw new Error(`Error al crear la preferencia de pago (${response.status})`);
      }

      const data = await response.json();
      
      if (userCountry === 'AR') {
        if (data.preference.init_point) {
          window.location.href = data.preference.init_point;
        } else {
          throw new Error("No se recibió la URL de pago de Mercado Pago.");
        }
      } else {
        if (data.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          throw new Error("No se recibió la URL de pago de dLocal.");
        }
      }

    } catch (error: any) {
      console.error("Error creating payment preference:", error);
      toast.error(error.message || "Ocurrió un error inesperado al intentar procesar el pago.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };
  

  const formatPriceDisplay = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/product-pricing')}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Tu Tienda Virtual
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Paso {currentStep} de 3
                </p>
              </div>
            </div>
            
            <Button
              onClick={nextStep}
              disabled={currentStep === 3}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Store Preview */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Así es como tu tienda virtual lucirá
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Una tienda profesional con tus productos, precios y talles
              </p>
            </div>

            {/* Store Preview Card */}
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Mi Tienda de Ropa</CardTitle>
                    <p className="text-purple-100">my.tiendia.app/mitiendaderopa</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white dark:bg-gray-700 rounded-2xl p-4 border border-gray-200 dark:border-gray-600 shadow-sm">
                      <div className="aspect-square bg-gray-100 dark:bg-gray-600 rounded-xl overflow-hidden mb-3">
                        <img
                          src={product.imageURL}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">
                        {product.name}
                      </h3>
                      {product.price && (
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 mb-2">
                          {formatPriceDisplay(product.price)}
                        </p>
                      )}
                      {product.sizes && product.sizes.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(product.sizes).slice(0, 3).map((size: any, index: number) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs rounded-lg text-gray-600 dark:text-gray-300">
                              {size.name}
                            </span>
                          ))}
                          {JSON.parse(product.sizes).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs rounded-lg text-gray-600 dark:text-gray-300">
                              +{JSON.parse(product.sizes).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Advantages */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Ventajas de crear tu tienda virtual
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Descubre por qué miles de emprendedores ya confían en Tiendia
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Tienda 24/7
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tu tienda está abierta las 24 horas del día, los 7 días de la semana. Los clientes pueden ver tus productos y hacer pedidos en cualquier momento.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Pedidos por WhatsApp
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Los clientes te contactan directamente por WhatsApp para hacer sus pedidos. Sin intermediarios, sin comisiones adicionales.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Control de Inventario
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Gestiona tus talles y stock de forma automática. Nunca más vendas productos que no tienes en stock.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Link className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Link Personalizado
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tu tienda tendrá su propia URL única y profesional. Fácil de compartir en redes sociales y con tus clientes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Sin Comisiones
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No pagas comisiones por venta. Todo el dinero va directo a tu bolsillo. Solo pagas la suscripción mensual.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-white/20 dark:border-gray-700/50 shadow-xl">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
                      <Store className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Diseño Profesional
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Tu tienda se ve profesional y moderna. Diseño optimizado para móviles que genera confianza en tus clientes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            {/* <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">¿Por qué elegir Tiendia?</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div>
                  <div className="text-3xl font-bold mb-2">+500</div>
                  <div className="text-purple-100">Tiendas activas</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">+10,000</div>
                  <div className="text-purple-100">Productos vendidos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-2">4.9⭐</div>
                  <div className="text-purple-100">Satisfacción</div>
                </div>
              </div>
            </div> */}
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                ¡Último paso!
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Después del pago ya podrás tener el link a tu tienda y recibir pedidos de clientes
              </p>
            </div>

            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Plan Mi Tiendia
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  {getPaymentProviderName()} - Pago seguro
                </p>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    {formatPrice(convertedPrice, userCurrency)}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">por mes</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Tienda virtual personalizada</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Link único y profesional</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Pedidos por WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Control de talles y stock</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Diseño responsive</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700 dark:text-gray-300">Sin comisiones por venta</span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Procesando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Pagar {formatPrice(convertedPrice, userCurrency)}
                    </div>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  Pago seguro a través de {getPaymentProviderName()}
                </p>
              </CardContent>
            </Card>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                tiendia.app - Pago seguro
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PayMiTiendia;
