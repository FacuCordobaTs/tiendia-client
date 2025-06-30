// src/pages/CreditsPage.tsx
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Sparkles, Globe, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useNavigate } from 'react-router';

const IMAGE_PACKS = [
    { id: 1, images: 1, price: 150, credits: 150 },
    { id: 2, images: 10, price: 1500, credits: 1500 },
    { id: 3, images: 50, price: 6600, credits: 6600, discount: 12.5 },
    { id: 4, images: 100, price: 12750, credits: 12750, discount: 15 }
];

const PAYPAL_PACKS = [
    { id: 3, images: 50, price: 4.50, credits: 6600, discount: 12.5 },
    { id: 4, images: 100, price: 8.30, credits: 12750, discount: 15 }
];

type PaymentMethod = 'paypal' | 'mercadopago' | null;

function CreditsPage() {
    const { user } = useAuth();
    const [selectedPack, setSelectedPack] = useState<typeof IMAGE_PACKS[0] | null>(null);
    const [selectedPayPalPack, setSelectedPayPalPack] = useState<typeof PAYPAL_PACKS[0] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [userCountry, setUserCountry] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(null);

    const navigate = useNavigate();

    const API_BASE_URL = 'https://api.tiendia.app';

    useEffect(() => {
        detectUserCountry();
    }, []);

    const detectUserCountry = async () => {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const country = data.country_code;
            setUserCountry(country);
        } catch (error) {
            console.log('Could not detect country automatically');
            setUserCountry('unknown');
        }
    };

    const isFromArgentina = userCountry === 'AR';

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
            const response = await fetch(`${API_BASE_URL}/api/payments/create-preference`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ credits: selectedPack.credits }),
                credentials: 'include',
            });

            if (!response.ok) {
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
            if (data.preference.init_point) {
                setLoading(false)
                window.location.href = data.preference.init_point;
            } else {
                throw new Error("No se recibió la URL de pago de Mercado Pago.");
            }

        } catch (err: any) {
            console.error("Error creating payment preference:", err);
            setError(err.message || "Ocurrió un error inesperado al intentar procesar el pago.");
            setLoading(false);
        }
    };

    const createPayPalOrder = async () => {
        if (!selectedPayPalPack) return;
        
        const response = await fetch(`${API_BASE_URL}/api/payments/create-paypal-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ price: selectedPayPalPack.price }),
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Error al crear la orden de PayPal');
        }

        const data = await response.json();
        console.log("data:",data)
        return data.orderId;
    };

    const onPayPalApprove = async ( ) => {
        if (!selectedPayPalPack) return;

        setError(null);
        navigate('/home')
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

            {/* Payment Method Selection */}
            {!selectedPaymentMethod && (
                <div className="max-w-4xl mx-auto px-4 mb-8">
                    <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0 shadow-lg">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-xl font-medium text-gray-900 dark:text-gray-50">
                                Método de Pago
                            </CardTitle>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">
                                Elige tu método de pago preferido
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Button
                                    onClick={() => setSelectedPaymentMethod('paypal')}
                                    className="w-full py-6 text-base font-medium bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100 transition-all duration-200 rounded-xl"
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-lg font-semibold">PayPal</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">Disponible mundialmente</span>
                                    </div>
                                </Button>
                                
                                <Button
                                    onClick={() => setSelectedPaymentMethod('mercadopago')}
                                    className={`w-full py-6 text-base font-medium border-2 transition-all duration-200 rounded-xl ${
                                        isFromArgentina 
                                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-900 dark:text-gray-100' 
                                            : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                                    disabled={!isFromArgentina}
                                >
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="text-lg font-semibold">Mercado Pago</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {isFromArgentina ? 'Solo para Argentina' : 'Solo disponible en Argentina'}
                                        </span>
                                    </div>
                                </Button>
                            </div>
                            
                            {!isFromArgentina && (
                                <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    <Globe className="h-4 w-4 text-blue-500" />
                                    <AlertTitle>Ubicación detectada</AlertTitle>
                                    <AlertDescription>
                                        Detectamos que no estás en Argentina. Mercado Pago solo está disponible para usuarios argentinos. 
                                        Te recomendamos usar PayPal para realizar tu pago de forma segura.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* PayPal Packs */}
            {selectedPaymentMethod === 'paypal' && (
                <main className="p-4 flex-grow flex items-center justify-center">
                    <Card className="w-full max-w-4xl shadow-xl transition-all duration-500 ease-in-out bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
                        <CardHeader className="pb-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedPaymentMethod(null)}
                                    className="flex items-center gap-2"
                                >
                                    ← Volver
                                </Button>
                            </div>
                            <CardTitle className="text-2xl text-center font-medium text-gray-900 dark:text-gray-50">
                                Packs de imágenes - PayPal
                            </CardTitle>
                            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                                Selecciona el pack que mejor se adapte a tus necesidades
                            </p>
                            <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-lg flex items-center justify-center gap-2">
                                💰 Precios en Dólares Americanos
                            </p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                                {PAYPAL_PACKS.map((pack) => (
                                    <div
                                        key={pack.id}
                                        onClick={() => setSelectedPayPalPack(pack)}
                                        className={`group relative p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                                            selectedPayPalPack?.id === pack.id
                                                ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 dark:from-blue-500/30 dark:to-blue-600/20 border-2 border-blue-500/50'
                                                : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500/30 hover:shadow-lg dark:hover:shadow-blue-500/10'
                                        }`}
                                    >
                                        <div className="flex flex-col items-center text-center">
                                            <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
                                                {pack.images} Imágenes
                                            </h3>
                                            <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-4">
                                                ${pack.price}
                                            </p>
                                            <span className="mt-3 px-4 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                                {pack.discount}% de ahorro
                                            </span>
                                            <div className="mt-4 text-sm text-gray-500 dark:text-gray-300">
                                                {pack.images} imágenes profesionales
                                            </div>
                                            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                                                Pago seguro con PayPal
                                            </div>
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

                            {selectedPayPalPack && (
                                <div className="mt-8 w-full max-w-md">
                                    <PayPalScriptProvider options={{ clientId: "AeE5syzTsbadw3e6oIeu_DIt_Ne6OtEZcwpIE3YOlYbqH6KOfFWRjEL8U-PiBZc4hNrEXwi8fquMhc_S" }}>
                                        <PayPalButtons
                                            createOrder={async () => {
                                                const orderId = await createPayPalOrder();
                                                return orderId;
                                            }}
                                            onApprove={async () => {
                                                await onPayPalApprove( );
                                            }}
                                            style={{ layout: "vertical" }}
                                            />
                                    </PayPalScriptProvider>
                                </div>
                            )}

                            <p className="mt-8 text-sm text-center text-gray-500 dark:text-gray-300 max-w-lg">
                                Si ya realizaste tu pago y todavía no lo ves acreditado en la app simplemente recarga la página
                            </p>
                        </CardContent>
                    </Card>
                </main>
            )}

            {/* Mercado Pago Packs */}
            {selectedPaymentMethod === 'mercadopago' && (
                <main className="p-4 flex-grow flex items-center justify-center">
                    <Card className="w-full max-w-4xl shadow-xl transition-all duration-500 ease-in-out bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
                        <CardHeader className="pb-8">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setSelectedPaymentMethod(null)}
                                    className="flex items-center gap-2"
                                >
                                    ← Volver
                                </Button>
                            </div>
                            <CardTitle className="text-2xl text-center font-medium text-gray-900 dark:text-gray-50">
                                Packs de imágenes - Mercado Pago
                            </CardTitle>
                            <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                                Presiona la opción que prefieras
                            </p>
                            <p className="text-center text-gray-600 dark:text-gray-400 mt-2 text-lg flex items-center justify-center gap-2">
                                🇦🇷 Precios en Pesos Argentinos
                            </p>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 w-full px-2 md:px-4">
                                {IMAGE_PACKS.map((pack) => (
                                    <div
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack)}
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
                                                ${pack.price.toLocaleString('es-AR')}
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
                                    `Pagar $${selectedPack ? selectedPack.price.toLocaleString('es-AR') : '0'}`
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            )}

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