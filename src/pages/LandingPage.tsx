import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Rocket, Check, Sparkles, Mail } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex flex-col items-center">
      {/* Hero Section */}
      <section className="container py-24 text-center space-y-8">
        <Badge variant="outline" className="text-sm px-4 py-1 bg-primary/10 text-primary">
          🚀 Lanza tu tienda inteligente hoy
        </Badge>
        
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
          tiendia.app
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Plataforma todo-en-uno para crear y gestionar tu ecommerce con inteligencia artificial
        </p>
        <Button size="lg" className="gap-2 text-lg" onClick={() => window.location.href = 'https://ecommerce-admin-eyh.pages.dev/signin'}>
            <Rocket className="h-5 w-5" />
            Comenzar gratis
        </Button>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12">
          {[
            ["🛍️", "Creación en 5 min"],
            ["🤖", "Asistente IA"],
            ["💸", "0% comisiones"],
            ["📱", "App integrada"]
          ].map(([emoji, text]) => (
            <div key={text} className="flex flex-col items-center gap-2 p-4 bg-muted/50 rounded-lg">
              <span className="text-2xl">{emoji}</span>
              <span className="font-medium">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container py-12 space-y-12">
        <h2 className="text-3xl font-bold text-center">Planes para cada necesidad</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Plan Básico */}
          <Card className="p-6 relative hover:border-primary transition-colors">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Básico</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$5.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <Button className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Comenzar ya
              </Button>
              
              <ul className="space-y-3">
                {[
                  "🛒 Tienda en linea",
                  "📦 Aceptar pedidos",
                  "💵 Pagos sin comisiones",
                  "🤖 Gestión autónoma",
                  "📲 Notificaciones app",
                  "👗 Ropa y comida",
                  "🎨 Interfaz estándar"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Plan Profesional */}
          <Card className="p-6 border-primary relative hover:border-primary/80">
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary/10 text-primary">Más popular</Badge>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Profesional</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$10.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Contactanos
              </Button>
              
              <ul className="space-y-3">
                {[
                  "✅ Todo el plan Básico",
                  "📞 Notificaciones WhatsApp",
                  "🎨 Interfaz personalizada",
                  "🌐 Dominio propio",
                  "🧾 Facturas electrónicas",
                  "📈 Estadísticas avanzadas",
                  "📸 Redes sociales integradas"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Plan Piloto */}
          <Card className="p-6 relative hover:border-primary">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">Piloto Automático</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$50.000</span>
                <span className="text-muted-foreground">/mes</span>
              </div>
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Contactanos
              </Button>
              
              <ul className="space-y-3">
                {[
                  "✅ Todos los planes anteriores",
                  "💬 Agentes IA multiplataforma",
                  "🤖 Automatización completa",
                  "📊 Analítica predictiva",
                  "🛡️ Soporte prioritario",
                  "🎯 Campañas automáticas",
                  "🚀 Onboarding personalizado"
                ].map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      </section>
    </div>
  )
}