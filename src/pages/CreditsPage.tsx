// src/pages/CreditsPage.tsx
import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const MIN_CREDITS = 50;
const MAX_CREDITS = 10000;
const CREDIT_COST_PER_IMAGE = 50;

function CreditsPage() {
    const { user } = useAuth();
    const [credits, setCredits] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const API_BASE_URL = 'https://api.tiendia.app';

    useEffect(() => {
        // Enfocar el input automáticamente al cargar
        const timer = setTimeout(() => {
            document.getElementById('amount-input')?.focus();
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // Permitir solo números
        const value = event.target.value.replace(/[^0-9]/g, '');
        setCredits(value);
        setError(null);
    };

    const handlePurchase = async () => {
        if (!user?.id) {
            setError("Debes iniciar sesión para comprar créditos.");
            return;
        }

        const creditValue = parseInt(credits, 10);
        if (isNaN(creditValue) || creditValue < MIN_CREDITS) {
            setError(`La cantidad mínima de créditos es ${MIN_CREDITS}.`);
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
                body: JSON.stringify({ credits: creditValue }),
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
            console.log(data)
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

    const creditsValue = credits ? parseInt(credits, 10) : 0;
    const imagesGeneratable = Math.floor(creditsValue / CREDIT_COST_PER_IMAGE) || 0;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pt-6 md:pl-72 pt-16 pl-4 pr-4 flex flex-col">
            <AdminSidebar />

            <header className="py-8">
                <h1 className="text-3xl md:text-4xl font-bold pl-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <CreditCard className="w-8 h-8" /> Cargar Créditos
                </h1>
            </header>

            <main className="p-4 flex-grow flex items-center justify-center">
                <Card className="w-full max-w-md shadow-lg transition-all duration-500 ease-in-out bg-white dark:bg-gray-900 border dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-xl text-center text-gray-900 dark:text-gray-50">Ingresa el monto a cargar</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="w-full flex justify-center items-center mb-6">
                            <span className="text-2xl text-gray-400 dark:text-gray-500">$</span>
                            <input
                                id="amount-input"
                                type="number"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={credits}
                                onChange={handleInputChange}
                                placeholder="00000"
                                min={MIN_CREDITS}
                                max={MAX_CREDITS}
                                className="text-6xl font-bold text-center bg-transparent focus:outline-none w-48 placeholder-gray-200 dark:placeholder-gray-700 text-gray-900 dark:text-gray-50"
                                disabled={loading}
                            />
                        </div>

                        {credits && (
                            <div className="text-center text-gray-600 dark:text-gray-400 text-sm mt-2 transition-opacity duration-300">
                                <p>Con {creditsValue.toLocaleString('es-AR')} créditos podrás generar:</p>
                                <p className="font-semibold text-primary dark:text-purple-400">{imagesGeneratable} {imagesGeneratable === 1 ? 'imagen' : 'imágenes'}</p>
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="mt-4 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200">
                                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                <AlertTitle className="font-semibold">Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                            Si ya realizaste tu pago y todavia no lo ves acreditado en la app simplemente recarga la pagina
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full text-lg py-6 mt-4 transition-all duration-300 ease-in-out"
                            onClick={handlePurchase}
                            disabled={loading || !credits || parseInt(credits, 10) < MIN_CREDITS}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Procesando...
                                </>
                            ) : (
                                `Pagar $${credits ? parseInt(credits, 10).toLocaleString('es-AR') : '0'}`
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </main>

            <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400 mt-auto">
                <p>✨ tiendia.app - Pago seguro con Mercado Pago</p>
            </footer>
        </div>
    );
}

export default CreditsPage;