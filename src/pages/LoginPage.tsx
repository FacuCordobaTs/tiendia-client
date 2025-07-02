import React, { useEffect, useState } from "react"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Clock, DollarSign, ImageIcon, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router"; 

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); 
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { loginOrRegister } = useAuth(); 
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      let message = 'Error durante el inicio de sesión con Google.';
      if (oauthError === 'invalid_state') message = 'Error de seguridad (estado inválido). Inténtalo de nuevo.';
      if (oauthError === 'access_denied') message = 'Permiso denegado para acceder con Google.';
      if (oauthError === 'email_google_conflict') message = 'Este email ya está asociado con otra cuenta de Google.';
      if (oauthError === 'google_callback_failed') message = 'Falló la comunicación con Google. Inténtalo de nuevo.';
      setError(message);
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); 
    setError(null); 
    try {
      await loginOrRegister(email, password);
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas o error del servidor. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false); 
    }
  };
  
  const handleGoogleLogin = () => {
    setError(null);
    setIsLoading(true); 
    window.location.href = 'https://api.tiendia.app/api/auth/google'; 
  };


  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-gradient-to-br from-background to-muted/50">
      {/* Sección izquierda – Beneficios (sin cambios) */}
      <div className="hidden lg:flex flex-col justify-center gap-8 p-12 bg-muted/20 dark:bg-slate-800/30">
        <div className="space-y-6 max-w-md">
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Sparkles className="h-7 w-7 text-primary" />
            Transforma tus Fotos de Producto
          </h2>
          <ul className="space-y-4 text-muted-foreground text-base">
            <li className="flex items-start gap-3">
              <ImageIcon className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Calidad de Estudio Profesional</span>
                <p className="text-sm">Imágenes impactantes sin necesidad de fotógrafos ni equipos costosos.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Resultados en Segundos</span>
                <p className="text-sm">Acelera tus lanzamientos con generación de imágenes casi instantánea.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Ahorro Significativo</span>
                <p className="text-sm">Reduce drásticamente los costos de producción fotográfica.</p>
              </div>
            </li>
              <li className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 mt-1 text-primary flex-shrink-0" />
              <div>
                <span className="font-semibold text-foreground">Atrae y Vende Más</span>
                  <p className="text-sm">Fotos de alta calidad que capturan la atención y aumentan conversiones.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Sección derecha – Formulario de inicio de sesión */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
             {/* Título más estilizado como en Register */}
             <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
                tiendia.app
             </h1>
            <p className="text-muted-foreground">
              Inicia sesión para generar imágenes de producto con IA.
            </p>
          </div>

          <div className="space-y-4">
            
            <Button 
            variant="outline" 
            className="w-full gap-2" 
            disabled={isLoading}
            onClick={handleGoogleLogin}
            >
              <FaGoogle className="h-4 w-4" />
              Continuar con Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  O ingresa con email
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-500 text-center">
                  {error}
                </p>
              )}

              <Button className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}