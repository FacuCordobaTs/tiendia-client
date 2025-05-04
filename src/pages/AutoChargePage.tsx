// src/pages/AutoChargePage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/context/AuthContext';
import AdminSidebar from '@/components/AdminSidebar';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

const AUTO_CHARGE_AMOUNT = 500;
const API_BASE_URL = 'https://api.tiendia.app';

function AutoChargePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const chargeCredits = async () => {
            if (!user) {
                setError('Debes iniciar sesión para acceder a esta página.');
                setLoading(false);
                // Opcional: redirigir a login después de un tiempo
                setTimeout(() => navigate('/login'), 3000);
                return;
            }

            setLoading(true);
            setError(null);
            setSuccess(null);

            try {
                const response = await fetch(`${API_BASE_URL}/api/credits/auto-charge`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || `Error ${response.status}`);
                }

                setSuccess(data.message || `Se descontaron ${AUTO_CHARGE_AMOUNT} créditos.`);

                // Opcional: redirigir a otra página después del éxito
                // setTimeout(() => navigate('/'), 3000); 

            } catch (err: any) {
                console.error('Error en el cargo automático:', err);
                setError(err.message || 'Ocurrió un error al intentar descontar los créditos.');
            } finally {
                setLoading(false);
            }
        };

        chargeCredits();
    }, [user, navigate ]);

    return (
        <div className="min-h-screen bg-gray-50 md:pt-6 md:pl-72 pt-16 pl-4 pr-4 flex flex-col">
            <AdminSidebar />

            <header className="py-8">
                <h1 className="text-3xl md:text-4xl font-bold pl-4">
                    Procesando Cargo Automático
                </h1>
            </header>

            <main className="p-4 flex-grow flex items-center justify-center">
                <div className="w-full max-w-md">
                    {loading && (
                        <div className="flex flex-col items-center justify-center text-center p-6 border rounded-lg shadow-sm bg-white">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                            <p className="text-lg font-medium text-gray-700">Procesando el cargo de {AUTO_CHARGE_AMOUNT} créditos...</p>
                            <p className="text-sm text-gray-500">Por favor, espera un momento.</p>
                        </div>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                            <Button variant="link" onClick={() => navigate('/')} className="mt-2">Volver al inicio</Button>
                        </Alert>
                    )}

                    {success && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertTitle>Éxito</AlertTitle>
                            <AlertDescription>{success}</AlertDescription>
                             <Button variant="link" onClick={() => navigate('/')} className="mt-2">Volver al inicio</Button>
                        </Alert>
                    )}
                </div>
            </main>

            <footer className="py-6 text-center text-sm text-gray-500 mt-auto">
                <p>✨ tiendia.app</p>
            </footer>
        </div>
    );
}

export default AutoChargePage;