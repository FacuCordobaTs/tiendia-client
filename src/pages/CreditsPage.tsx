// src/pages/CreditsPage.tsx
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Sparkles, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Base prices in USD
const BASE_PACKS = [
    { id: 1, images: 1, priceUSD: 0.125, credits: 50 },
    { id: 2, images: 10, priceUSD: 1.25, credits: 500 },
    { id: 3, images: 50, priceUSD: 5.5, credits: 2500, discount: 12.5 },
    { id: 4, images: 100, priceUSD: 10.625, credits: 5000, discount: 15 }
];

const ARG_PACKS = [
    { id: 1, images: 1, price: 150, credits: 50 },
    { id: 2, images: 10, price: 1500, credits: 500 },
    { id: 3, images: 50, price: 6600, credits: 2500, discount: 12.5 },
    { id: 4, images: 100, price: 12750, credits: 5000, discount: 15 }
]

// Exchange rates from USD to other currencies
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

// Country to currency mapping
const COUNTRY_CURRENCY_MAP: { [key: string]: string } = {
    'AR': 'ARS', // Argentina
    'BR': 'BRL', // Brazil
    'CL': 'CLP', // Chile
    'CO': 'COP', // Colombia
    'MX': 'MXN', // Mexico
    'PE': 'PEN', // Peru
    'UY': 'UYU', // Uruguay
    'PY': 'PYG', // Paraguay
    'BO': 'BOB', // Bolivia
    'DO': 'DOP', // Dominican Republic
    'GT': 'GTQ', // Guatemala
    'CR': 'CRC', // Costa Rica
    'MY': 'MYR', // Malaysia
    'ID': 'IDR', // Indonesia
    'KE': 'KES', // Kenya
    'NG': 'NGN', // Nigeria
    // Add more countries as needed
};

// Currency symbols and formatting
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

function CreditsPage() {
    const { user } = useAuth();
    const [selectedPack, setSelectedPack] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userCountry, setUserCountry] = useState<string | null>(null);
    const [userCurrency, setUserCurrency] = useState<string>('USD');
    const [convertedPacks, setConvertedPacks] = useState<any[]>([]);

    const API_BASE_URL = 'https://api.tiendia.app';

    useEffect(() => {
        detectUserCountry();
    }, []);

    useEffect(() => {
        if (userCountry) {
            const currency = COUNTRY_CURRENCY_MAP[userCountry] || 'USD';
            setUserCurrency(currency);
            convertPacksToCurrency(currency);
        }
    }, [userCountry]);

    const detectUserCountry = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const country = data.country_code;
            setUserCountry(country);
            console.log('Detected country:', country);
        } catch (error) {
            console.log('Could not detect country automatically');
            setUserCountry('unknown');
        }
    };

    const convertPacksToCurrency = (currency: string) => {
        const exchangeRate = EXCHANGE_RATES.find(rate => rate.target_currency === currency);
        
        if (!exchangeRate && currency !== 'USD') {
            console.log(`No exchange rate found for ${currency}, using USD`);
            if (userCountry === 'AR') {
                setConvertedPacks(ARG_PACKS);
            } else {
                setConvertedPacks(BASE_PACKS);
            }
            return;
        }

        const rate = exchangeRate ? exchangeRate.value : 1;
        
        const converted = BASE_PACKS.map(pack => ({
            ...pack,
            price: Math.round(pack.priceUSD * rate * 100) / 100, // Round to 2 decimal places
            originalPriceUSD: pack.priceUSD
        }));

        if (userCountry === 'AR') {
            setConvertedPacks(ARG_PACKS);
        } else {
            setConvertedPacks(converted);
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

    const getCurrencyDisplay = () => {
        const currencyInfo = CURRENCY_INFO[userCurrency];
        return currencyInfo ? `${currencyInfo.flag} Precios en ${userCurrency}` : `Precios en ${userCurrency}`;
    };
    
    const handlePurchase = async () => {
        if (!user?.id) {
            setError("Debes iniciar sesión para comprar créditos.");
            return;
        }

        if (!selectedPack) {
            setError("Por favor selecciona un pack de imágenes.");
            return;
        }

        setLoading(true);
        setError(null);

        try {

            let response;
            if (userCountry === 'AR') {
                // Mercado Pago flow
                const endpoint = `${API_BASE_URL}/api/payments/create-preference`;

                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ credits: selectedPack.price }),
                });
            } else {
                // dLocal flow
                const endpoint = `${API_BASE_URL}/api/payments/create-dlocal-payment`;

                response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({ credits: selectedPack.priceUSD }),
                });
                console.log(response)
            }

            

            if (!response.ok) { //
                let errorMsg = `Error ${response.status}`;
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody.message || `Error al crear la preferencia de pago (${response.status})`;
                } catch (_) {
                    errorMsg = `Error al crear la preferencia de pago (${response.status})`;
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            
            if (userCountry === 'AR') {
                // Mercado Pago flow
                if (data.preference.init_point) {
                    setLoading(false);
                    window.location.href = data.preference.init_point;
                } else {
                    throw new Error("No se recibió la URL de pago de Mercado Pago.");
                }
            } else {
                // dLocal flow
                if (data.redirect_url) {
                    setLoading(false);
                    window.location.href = data.redirect_url;
                } else {
                    throw new Error("No se recibió la URL de pago de dLocal.");
                }
            }

        } catch (err: any) {
            console.error("Error creating payment preference:", err);
            setError(err.message || "Ocurrió un error inesperado al intentar procesar el pago.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 md:pt-6 md:pl-72 pt-16 pl-4 pr-4 flex flex-col">
            <AdminSidebar />

            <header className="py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 flex items-center justify-center gap-3">
                        <CreditCard className="w-12 h-12" />
                        Genera imágenes profesionales
                    </h1>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
                        Selecciona el pack que mejor se adapte a tus necesidades
                    </p>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 mb-8">
                <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="pt-6">
                        <div className="prose dark:prose-invert max-w-none">
                            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                                <span>✨</span> ¿Por qué cobramos por las imágenes?
                            </h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                Esta app fue creada por un estudiante de la UTN con el objetivo de que todas las tiendas de ropa puedan tener acceso a imágenes profesionales de sus productos de forma accesible. 🎓
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                                La generación de imágenes tiene un costo asociado, y el monto que solicitamos por las imágenes es lo necesario para mantener la aplicación funcionando y seguir mejorando. 💫
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                                Los pagos se realizan de forma segura a través de nuestros proveedores de pago. Al utilizar Tiendia, no solo obtienes acceso a imágenes profesionales de tus productos a un precio accesible, sino que también contribuyes a mejorar la aplicación para que puedas obtener imágenes aún mejores en el futuro. 🤝
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                                ¡Muchas gracias por tu apoyo! 🙏
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <main className="p-4 flex-grow flex items-center justify-center">
                <Card className="w-full max-w-4xl shadow-xl transition-all duration-500 ease-in-out bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
                    <CardHeader className="pb-8"> 
                        <CardTitle className="text-2xl text-center font-medium text-gray-900 dark:text-gray-50">
                            Packs de imágenes - {getPaymentProviderName()}
                        </CardTitle>
                        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                            Presiona la opción que prefieras
                        </p>
                        <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-lg flex items-center justify-center gap-2">
                            {getCurrencyDisplay()}
                        </p>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 w-full px-2 md:px-4">
                            {convertedPacks.map((pack) => (
                                <div
                                    key={pack.id}
                                    onClick={() => {
                                        if (userCountry === 'AR') {
                                            setSelectedPack(ARG_PACKS[pack.id - 1]);
                                        } else {
                                            setSelectedPack(pack);
                                        }
                                    }}
                                    className={`group relative p-4 md:p-8 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300 ${
                                        selectedPack?.id === pack.id
                                            ? 'bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 border-2 border-primary/50'
                                            : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-primary/30 hover:shadow-lg dark:hover:shadow-primary/10'
                                    } ${pack.id === 3 ? 'ring-2 ring-primary/20 hover:ring-primary/40 dark:ring-primary/30 dark:hover:ring-primary/50' : ''}`}
                                >
                                    {pack.id === 3 && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/90 dark:from-primary/90 dark:to-primary text-white dark:text-black px-4 py-1 rounded-full text-xs font-medium shadow-lg dark:shadow-primary/20">
                                            Más elegido
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center text-center">
                                        <h3 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                                            {pack.images} {pack.images === 1 ? 'Imagen' : 'Imágenes'}
                                        </h3>
                                        <p className="text-3xl md:text-4xl font-bold text-primary dark:text-primary/90 mt-2 md:mt-4">
                                            {formatPrice(pack.price, userCurrency)}
                                        </p>
                                        {pack.discount && (
                                            <span className="mt-2 md:mt-3 px-3 md:px-4 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                                {pack.discount}% de ahorro
                                            </span>
                                        )}
                                        <div className="mt-2 md:mt-4 text-xs md:text-sm text-gray-500 dark:text-gray-300">
                                            {pack.images === 1 ? 'Una imagen profesional' : `${pack.images} imágenes profesionales`}
                                        </div>
                                        {pack.id === 3 && (
                                            <div className="mt-2 text-xs text-primary dark:text-primary/90">
                                                Ideal para tiendas medianas
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mt-8 bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                <AlertTitle className="font-semibold">Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <p className="mt-8 text-sm text-center text-gray-500 dark:text-gray-300 max-w-lg">
                            Si ya realizaste tu pago y todavia no lo ves acreditado en la app simplemente recarga la pagina
                        </p>
                    </CardContent>
                    <CardFooter className="px-8 pb-8">
                        <Button
                            className="w-full text-lg py-7 rounded-xl transition-all duration-300 ease-in-out bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-primary/25 dark:shadow-primary/20"
                            onClick={handlePurchase}
                            disabled={loading || !selectedPack}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
                                </>
                            ) : (
                                `Pagar ${selectedPack ? formatPrice(selectedPack.price, userCurrency) : '0'}`
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </main>

            <footer className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
                <p className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    tiendia.app - Pago seguro
                </p>
            </footer>
        </div>
    );
}

export default CreditsPage;