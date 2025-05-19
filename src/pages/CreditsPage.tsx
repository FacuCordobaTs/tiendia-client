// src/pages/CreditsPage.tsx
import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const IMAGE_PACKS = [
    { id: 1, images: 1, price: 80, credits: 80 },
    { id: 2, images: 10, price: 800, credits: 800 },
    { id: 3, images: 50, price: 3500, credits: 3500, discount: 12.5 },
    { id: 4, images: 100, price: 6800, credits: 6800, discount: 15 }
];

function CreditsPage() {
    const { user } = useAuth();
    const [selectedPack, setSelectedPack] = useState<typeof IMAGE_PACKS[0] | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = 'https://api.tiendia.app';

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

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 md:pt-6 md:pl-72 pt-16 pl-4 pr-4 flex flex-col">
            <AdminSidebar />

            <header className="py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 flex items-center justify-center gap-3">
                        
                        Genera imágenes profesionales
                    </h1>
                    <p className="text-center text-gray-600 dark:text-gray-400 mt-4 text-lg">
                        Selecciona el pack que mejor se adapte a tus necesidades
                    </p>
                </div>
            </header>

            <main className="p-4 flex-grow flex items-center justify-center">
                <Card className="w-full max-w-4xl shadow-xl transition-all duration-500 ease-in-out bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
                    <CardHeader className="pb-8">
                        <CardTitle className="text-2xl text-center font-medium text-gray-900 dark:text-gray-50">
                            Packs de imágenes
                        </CardTitle>
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

            <footer className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
                <p className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    tiendia.app - Pago seguro con Mercado Pago
                </p>
            </footer>
        </div>
    );
}

export default CreditsPage;