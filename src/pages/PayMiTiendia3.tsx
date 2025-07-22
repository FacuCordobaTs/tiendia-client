import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router'; // Asumiendo que usas react-router-dom
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

// --- CONSTANTES DE MONEDA Y TIPO DE CAMBIO ---
// Estas constantes se mantienen para la lógica de precios dinámicos.

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

const COUNTRY_CURRENCY_MAP = {
    'AR': 'ARS', 'BR': 'BRL', 'CL': 'CLP', 'CO': 'COP', 'MX': 'MXN', 'PE': 'PEN',
    'UY': 'UYU', 'PY': 'PYG', 'BO': 'BOB', 'DO': 'DOP', 'GT': 'GTQ', 'CR': 'CRC',
    'MY': 'MYR', 'ID': 'IDR', 'KE': 'KES', 'NG': 'NGN'
};

const CURRENCY_INFO = {
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


function PayMiTiendia3() {
  // --- ESTADOS DEL COMPONENTE ---
  const [userCountry, setUserCountry] = useState('AR');
  const [userCurrency, setUserCurrency] = useState('ARS');
  const [convertedPrice, setConvertedPrice] = useState(2000);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // --- EFECTOS ---
  // Detecta el país del usuario al cargar el componente.
  useEffect(() => {
    detectUserCountry();
  }, []);

  // Actualiza la moneda y el precio cuando cambia el país del usuario.
  useEffect(() => {
    if (userCountry) {
      const currency = COUNTRY_CURRENCY_MAP[userCountry as keyof typeof COUNTRY_CURRENCY_MAP] || 'USD';
      setUserCurrency(currency);
      convertPrice(currency);
    }
  }, [userCountry]);

  // --- FUNCIONES LÓGICAS ---

  // Detecta el país del usuario a través de una API de geolocalización por IP.
  const detectUserCountry = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      setUserCountry(data.country_code || 'AR');
    } catch (error) {
      console.log('No se pudo detectar el país automáticamente. Usando AR por defecto.');
      setUserCountry('AR');
    }
  };

  // Convierte el precio base (2 USD) a la moneda local del usuario.
  const convertPrice = (currency: string) => {
    if (userCountry === 'AR') {
      setConvertedPrice(2000); // Precio fijo para Argentina
      return;
    }
    
    const exchangeRate = EXCHANGE_RATES.find(rate => rate.target_currency === currency);
    if (exchangeRate) {
      setConvertedPrice(Math.round(2 * exchangeRate.value * 100) / 100);
    } else {
      setConvertedPrice(2); // Por defecto, 2 USD si no se encuentra el tipo de cambio.
    }
  };

  // Formatea el precio con el símbolo y formato de la moneda correspondiente.
  const formatPrice = (price: number, currency: string) => {
    const currencyInfo = CURRENCY_INFO[currency as keyof typeof CURRENCY_INFO];
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

  // Devuelve el nombre del proveedor de pagos según el país.
  const getPaymentProviderName = () => {
    return userCountry === 'AR' ? 'Mercado Pago' : 'dLocal';
  };

  // Maneja la lógica de compra, creando la preferencia de pago.
  const handlePurchase = async () => {
    if (!user?.id) {
      toast.error("Debes iniciar sesión para continuar.");
      return;
    }

    setIsLoading(true);

    try {
      let response;
      if (userCountry === 'AR') {
        // Flujo de Mercado Pago
        response = await fetch('https://api.tiendia.app/api/payments/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credits: convertedPrice }),
        });
      } else {
        // Flujo de dLocal
        response = await fetch('https://api.tiendia.app/api/payments/create-dlocal-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credits: 2 }), // Siempre se envían 2 USD a dLocal
        });
      }

      if (!response.ok) {
        throw new Error(`Error al crear la preferencia de pago (${response.status})`);
      }

      const data = await response.json();
      
      const redirectUrl = userCountry === 'AR' ? data.preference?.init_point : data.redirect_url;

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        throw new Error(`No se recibió la URL de pago de ${getPaymentProviderName()}.`);
      }

    } catch (error) {
      console.error("Error creando la preferencia de pago:", error);
      toast.error(error instanceof Error ? error.message : "Ocurrió un error inesperado al intentar procesar el pago.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- RENDERIZADO DEL COMPONENTE ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header simple con botón de retroceso */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)} // Vuelve a la página anterior
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Activar Mi Tiendia
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal de la página de pago */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Pagar Tu Tiendia
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Mantenete al dia con tu suscripción mensual.
            </p>
          </div>

          <Card className="max-w-md mx-auto bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl">
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
                <p className="text-gray-600 dark:text-gray-400">pago único</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700 dark:text-gray-300">Tienda virtual</span>
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
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
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
              <Sparkles className="w-4 h-4 text-purple-400" />
              tiendia.app - Transacción segura
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PayMiTiendia3;