// src/components/AdminProductCard.jsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { FiEdit  } from "react-icons/fi";
import { Card } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import { useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "@/context/AuthContext";

interface Product {
  id: number;
  imageURL: string | null;
  name: string;
}

// Créditos necesarios para generar un anuncio
const REQUIRED_CREDITS = 50;

export default function AdminProductCard({ product, handleGenerateAd, onEdit }: {
  product: Product;
  // ACTUALIZACIÓN: Añadir originalImageUrl al tipo de la prop
  handleGenerateAd: (id: number, includeModel: boolean, originalImageUrl: string | null) => void;
  onEdit: () => void;
}) {
  const { name, imageURL } = product;
  const [includeModel, setIncludeModel] = useState(true);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  // Obtener información del usuario actual
  const { user } = useAuth();

  // Verificar si el usuario tiene suficientes créditos
  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;

  const handleGenerateClick = () => {
    if (!hasEnoughCredits) {
      setInsufficientCredits(true);
      return;
    }
    setInsufficientCredits(false); // Resetear alerta si hay créditos
    // ACTUALIZACIÓN: Pasar product.imageURL como tercer argumento
    handleGenerateAd(product.id, includeModel, product.imageURL);
  };

  return (
    <Drawer onOpenChange={(open) => !open && setInsufficientCredits(false)} /* Resetear alerta al cerrar */ >
      <DrawerTrigger asChild>
        <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] h-full hover:cursor-pointer w-full md:max-w-[280px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-full border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <AspectRatio ratio={4 / 3}>
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105 p-2" // Usar object-contain y añadir padding
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </AspectRatio>
          </div>
          <div className="p-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold truncate text-gray-800 dark:text-gray-100">{name}</h3>
            </div>
          </div>
        </Card>
      </DrawerTrigger>

      {/* Contenido del Drawer sin cambios significativos, solo ajustes menores de estilo si se desea */}
      <DrawerContent className="max-h-[95vh] bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-md p-4"> {/* Aumentar max-w y padding */}
            {/* Línea decorativa superior (estilo Apple) */}
           <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-4" />

           <div className="rounded-lg overflow-hidden mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
            {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="w-full h-52 object-contain p-2 bg-gray-50 dark:bg-gray-800" // Ajustar altura y object-contain
                  // Eliminado data-view-transition-name por simplicidad, puede causar problemas con Drawer
                />
              ) : (
                <div className="w-full h-52 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">Sin Imagen</div>
              )}
            </div>

            <div className="text-center mb-4"> {/* Centrar título */}
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  {product.name}
                </h2>
             </div>

           {/* Información de créditos */}
          <div className="mb-5 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
                <span>Créditos disponibles:</span>
                 <span className={`font-semibold ${hasEnoughCredits ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                   {user?.credits ?? 0}
                 </span>
              </div>
             <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                 Necesarios para generar: {REQUIRED_CREDITS}
             </div>
             {insufficientCredits && (
               <Alert variant="destructive" className="mt-3 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300">
                 <AlertCircle className="h-4 w-4" />
                 <AlertDescription className="text-xs">
                   No tienes suficientes créditos.
                   <Button
                     variant="link"
                     className="p-0 h-auto ml-1 text-red-700 dark:text-red-300 underline"
                     onClick={() => { /* Lógica para ir a créditos */ }}
                    >
                      Recargar
                    </Button>
                 </AlertDescription>
               </Alert>
              )}
           </div>

           <div className="mb-6">
             <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Opciones de Generación</h3>
             {/* Simplificado a una sola opción por ahora, se puede expandir */}
             <Button
                onClick={() => setIncludeModel(!includeModel)}
                variant="outline"
                className={`w-full rounded-lg transition-all px-4 py-3 h-auto flex items-center justify-between text-left border ${
                 includeModel
                   ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700'
                   : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
               }`}
              >
               <div className="flex items-center">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-colors ${includeModel ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                   {includeModel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                 </div>
                 <span className={`font-medium text-sm ${includeModel ? 'text-blue-800 dark:text-blue-200' : 'text-gray-700 dark:text-gray-300'}`}>Fondo neutro</span>
               </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{includeModel ? 'Activado' : 'Desactivado'}</span>
             </Button>
           </div>

          <div className="grid grid-cols-5 gap-3"> {/* Ajustado grid para balance */}
              <DrawerClose className="w-full col-span-4"> {/* Botón principal más grande */}
                <Button
                  className={`w-full transition-all duration-300 rounded-lg py-3 h-auto text-sm font-semibold flex items-center justify-center gap-2 ${
                   hasEnoughCredits
                     ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md hover:shadow-lg'
                     : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                 }`}
                  onClick={handleGenerateClick}
                  disabled={!hasEnoughCredits || !imageURL /* Deshabilitar si no hay imagen */}
                >
                 {!imageURL ? (
                    <>
                     <AlertCircle className="w-4 h-4" />
                     <span>Falta Imagen</span>
                    </>
                  ) : !hasEnoughCredits ? (
                    <>
                     <AlertCircle className="w-4 h-4" />
                      <span>Créditos insuficientes</span>
                   </>
                 ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> {/* Cambiado a Sparkles */}
                      <span>Generar ({REQUIRED_CREDITS} créd.)</span>
                    </>
                 )}
                </Button>
              </DrawerClose>

            <DrawerClose className="w-full col-span-1"> {/* Botón Editar más pequeño */}
               <Button
                 variant="outline"
                 className="w-full rounded-lg py-3 h-auto flex items-center justify-center border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                 onClick={onEdit}
                 aria-label="Editar Producto"
                >
                 <FiEdit className="w-5 h-5" />
                </Button>
              </DrawerClose>
            </div>

          </div>
      </DrawerContent>
    </Drawer>
  );
}