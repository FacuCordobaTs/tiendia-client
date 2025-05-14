import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FaGoogle } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router"; // Asegúrate de importar desde react-router-dom
import { Image as ImageIcon, Clock, DollarSign, TrendingUp, Sparkles } from "lucide-react";
export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      let message = 'Error durante el registro con Google.';
       if (oauthError === 'invalid_state') message = 'Error de seguridad (estado inválido). Inténtalo de nuevo.';
       if (oauthError === 'access_denied') message = 'Permiso denegado para registrarse con Google.';
       if (oauthError === 'email_google_conflict') message = 'Este email ya está asociado con otra cuenta de Google. Intenta iniciar sesión.';
       if (oauthError === 'google_callback_failed') message = 'Falló la comunicación con Google. Inténtalo de nuevo.';
      console.log(message)
      navigate('/register', { replace: true });
    }
  }, [searchParams, navigate]);


  const handleGoogleLogin = () => {
    setIsLoading(true); 
    window.location.href = 'https://api.tiendia.app/api/auth/google'; 
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2 bg-gradient-to-br from-background to-blue-50/50 dark:to-slate-900/50">
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

      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              tiendia.app
            </h1>
            <p className="text-muted-foreground">
              Genera imágenes profesionales para tus productos con IA.
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
          
          </div>
        </div>
      </div>
    </div>
  );
}