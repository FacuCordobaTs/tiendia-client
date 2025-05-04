import { ChevronRight, LogOut  } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12 md:mt-0 md:ml-64">
      <AdminSidebar />
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Configuración de Tienda</h1>
          <p className="text-muted-foreground">
            Administra la información de tu tienda y preferencias
          </p>
        </div>

        <nav className="flex flex-col items-start">
          <Button
          onClick={logout}
          >
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Cerrar Sesion</span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground/80" />
          </Button>

        </nav>
      </div>
    </div>
  );
}