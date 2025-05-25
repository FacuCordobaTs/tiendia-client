import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Importa subcomponentes de Card
import { Badge } from "@/components/ui/badge";
import { Sparkles, Image as ImageIcon, Check, Clock, DollarSign, TrendingUp, Upload } from "lucide-react"; // Iconos más relevantes
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

// --- Componente auxiliar para las tarjetas de características ---
function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
  return (
    <Card className="bg-card/50 hover:border-primary/30 transition-colors duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="p-2 bg-primary/10 rounded-md">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  // --- URLs para las imágenes de ejemplo - ¡REEMPLÁZALAS! ---
  const beforeImageUrl = "placeholder-antes.jpeg"; // Ruta a tu imagen de ejemplo "Antes"
  const afterImageUrl = "placeholder-despues.png"; // Ruta a tu imagen de ejemplo "Después"
  // --- Asegúrate de que estas imágenes existan en tu carpeta `public/images` o similar ---

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-blue-50/50 dark:to-slate-900/50 flex flex-col items-center text-foreground px-4"> {/* Fondo suave */}

      {/* --- Hero Section --- */}
      <section className="container pt-20 pb-16 md:pt-28 md:pb-24 text-center space-y-6 max-w-4xl"> {/* Ajuste de padding y max-width */}
        <Badge variant="outline" className="text-sm px-4 py-1 border-primary/50 bg-primary/10 text-primary font-medium shadow-sm">
          <Sparkles className="h-3 w-3 mr-2" /> Fotos de Producto con IA
        </Badge>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight md:leading-snug"> {/* Ajuste de tamaño y espaciado */}
          Transforma tus Fotos <span className="bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 bg-clip-text text-transparent">en Imagenes Profesionales</span>. ¡desde $68 por imagen!
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Sube la foto de tu producto y deja que nuestra IA genere imágenes profesionales de alta calidad en segundos. ¡Sin necesidad de estudio ni fotógrafo!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
           <Button size="lg" className="gap-2 text-lg shadow-lg hover:shadow-primary/30 transition-shadow duration-300" onClick={() => navigate(user ? "/home" : "/register")}>
             <Upload className="h-5 w-5" />
             {user ? "Ir a tus productos" : "Comenzar ahora"}
           </Button>
           {/* <Button size="lg" variant="outline" className="gap-2 text-lg">
               Ver Ejemplo <ArrowRight className="h-5 w-5" />
           </Button> */}
        </div>
      </section>

      {/* --- Before & After Section --- */}
      <section className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          De Esto... <span className="text-muted-foreground/80">a Esto</span> ✨
        </h2>
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
          {/* Antes */}
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-muted-foreground">Tu Foto Original</h3>
            <Card className="overflow-hidden shadow-lg w-full">
              <img
                src={beforeImageUrl} 
                alt="Foto de producto antes de la IA"
                className="aspect-square object-cover w-full transition-transform duration-300 ease-in-out hover:scale-105"
              />
            </Card>
          </div>

          {/* Después */}
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-4 text-primary">Generada con tiendia.app</h3>
            <Card className="overflow-hidden shadow-xl border-2 border-primary/50 w-full">
               <img
              src={afterImageUrl} 
              alt="Foto de producto generada por IA"
              className="aspect-square object-cover w-full object-top transition-transform duration-300 ease-in-out hover:scale-105"
              />
            </Card>
          </div>
        </div>
        <p className="text-center text-muted-foreground mt-8 max-w-2xl mx-auto">
          Nuestra IA analiza tu producto y lo presenta en el mejor escenario posible, con iluminación y estilo profesional.
        </p>
      </section>

      {/* --- Pricing Section --- */}
      <section className="container py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Packs de Imágenes
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Single Image Pack */}
          <Card className="bg-card/50 hover:border-primary/30 transition-colors duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">1 Imagen</CardTitle>
              <p className="text-3xl font-bold text-primary mt-2">$80</p>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Ideal para probar el servicio</p>
            </CardContent>
          </Card>

          {/* 10 Images Pack */}
          <Card className="bg-card/50 hover:border-primary/30 transition-colors duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">10 Imágenes</CardTitle>
              <p className="text-3xl font-bold text-primary mt-2">$800</p>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Perfecto para pequeños catálogos</p>
            </CardContent>
          </Card>

          {/* 50 Images Pack */}
          <Card className="bg-card/50 hover:border-primary/30 transition-colors duration-300 ease-in-out transform hover:-translate-y-1 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/90 text-white dark:text-black px-4 py-1 rounded-full text-xs font-medium shadow-lg">
              Más elegido
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">50 Imágenes</CardTitle>
              <p className="text-3xl font-bold text-primary mt-2">$3,500</p>
              <span className="text-sm text-green-600 dark:text-green-400">12.5% de ahorro</span>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Ideal para tiendas medianas</p>
            </CardContent>
          </Card>

          {/* 100 Images Pack */}
          <Card className="bg-card/50 hover:border-primary/30 transition-colors duration-300 ease-in-out transform hover:-translate-y-1">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">100 Imágenes</CardTitle>
              <p className="text-3xl font-bold text-primary mt-2">$6,800</p>
              <span className="text-sm text-green-600 dark:text-green-400">15% de ahorro</span>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">Para tiendas con gran catálogo</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* --- Features/Benefits Section --- */}
      <section className="container py-16 md:py-24 bg-muted/30 dark:bg-slate-800/20 rounded-2xl my-16"> {/* Fondo suave para destacar */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Ventajas que Impulsarán tu Tienda
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            icon={ImageIcon}
            title="Calidad de Estudio"
            description="Obtén imágenes profesionales sin costosos equipos ni fotógrafos."
          />
          <FeatureCard
            icon={Clock}
            title="Generación Instantánea"
            description="Transforma tus fotos en segundos, no días. Acelera tus lanzamientos."
          />
           <FeatureCard
            icon={DollarSign}
            title="Ahorro Significativo"
            description="Reduce drásticamente los costos asociados a la fotografía de producto tradicional."
          />
          <FeatureCard
            icon={TrendingUp}
            title="Atrae Más Clientes"
            description="Imágenes atractivas aumentan la confianza y las conversiones en tu tienda."
          />
           <FeatureCard
            icon={Upload}
            title="Increíblemente Fácil"
            description="Solo necesitas subir tu foto. Nuestra IA se encarga de la magia."
          />
          <FeatureCard
            icon={Check}
            title="Resultados Consistentes"
            description="Mantén un estilo visual profesional y coherente en todos tus productos."
          />
        </div>
      </section>

       {/* --- CTA Section --- */}
      <section className="container py-16 md:py-24 text-center space-y-6 max-w-3xl">
         <h2 className="text-3xl md:text-4xl font-bold">
           ¿Listo para Elevar tus Productos?
         </h2>
         <p className="text-lg md:text-xl text-muted-foreground">
           Regístrate y comienza a generar imágenes profesionales para tu tienda.
         </p>
         <Button size="lg" className="gap-2 text-lg shadow-lg hover:shadow-primary/30 transition-shadow duration-300" onClick={() => navigate("/register")}>
             <Sparkles className="h-5 w-5" />
             Comenzar ahora
         </Button>
       </section>

      {/* --- Footer --- */}
      <footer className="container py-8 text-center text-sm text-muted-foreground mt-12 border-t border-border/20">
        © {new Date().getFullYear()} tiendia.app - Imágenes IA para tu Éxito. Todos los derechos reservados.
      </footer>
    </div>
  );
}