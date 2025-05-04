import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { FiEdit, FiImage } from "react-icons/fi";
import { Card } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
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
  handleGenerateAd: (id: number, includeModel: boolean) => void;  
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
    
    handleGenerateAd(product.id, includeModel);
  };
  
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg h-full hover:cursor-pointer w-full md:max-w-[250px]">
          <div className="w-full border-b bg-muted/50">
            <AspectRatio ratio={4 / 3} className="bg-gradient-to-br from-muted/20 to-muted/50">
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/50">
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </AspectRatio>
          </div>
          <div className="p-4 flex flex-col justify-between h-min">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold truncate">{name}</h3>
            </div>
          </div>
        </Card>
      </DrawerTrigger>

      <DrawerContent className="max-h-[95vh]" >
        <div className="mx-auto w-full max-w-sm relative">
          
          <div className="pt-2 pb-4">
            <div className="rounded-lg overflow-hidden px-4">
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="w-full h-48 object-cover rounded-lg"
                  data-view-transition-name={`product-image-${product.id}`}
                />
              ) : (
                <div className="w-full h-48 bg-gray-200" />
              )}
            </div>

            <div className="px-4 pt-4 space-y-1">
              <h2 className="text-2xl font-bold" data-view-transition-name={`product-title-${product.id}`}>
                {product.name}
              </h2>
            </div>

            {/* Información de créditos */}
            <div className="px-4 pt-4">
              <div className="text-sm text-gray-600 flex justify-between items-center">
                <span>Créditos disponibles:</span>
                <span className={`font-semibold ${hasEnoughCredits ? 'text-green-600' : 'text-red-500'}`}>
                  {user?.credits || 0} / {REQUIRED_CREDITS} necesarios
                </span>
              </div>
              
              {insufficientCredits && (
                <Alert variant="destructive" className="mt-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <AlertDescription>
                    No tienes suficientes créditos para generar un anuncio. Se requieren {REQUIRED_CREDITS} créditos.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="px-4 pt-6">
              <h3 className="font-medium mb-3">Preferencias</h3>
              
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  onClick={() => setIncludeModel(!includeModel)}
                  variant="outline" 
                  className={`rounded-lg transition-all px-3 py-4 h-auto flex flex-col items-start text-left ${
                    includeModel ? 'bg-gradient-to-r from-orange-500 to-red-400 text-white hover:text-white' : ''
                  }`}
                >
                  <div className="flex items-center mb-1 w-full">
                    <div className={`w-6 h-6 rounded-full ${includeModel ? 'bg-white/30' : 'bg-amber-100'} flex items-center justify-center mr-2`}>
                      <span className={includeModel ? 'text-white' : 'text-amber-500'}>☀️</span>
                    </div>
                    <span className="font-medium flex-grow">Incluir un fondo neutro</span>
                    
                    {includeModel && <span className="ml-auto text-xs font-semibold">(Activado)</span>}
                  </div>
                </Button>
              </div>
            </div>

            <div className="px-4 pt-8 grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <DrawerClose className="w-full">
                  <Button 
                    className={`w-full ${hasEnoughCredits 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300" 
                      : "bg-gray-400"} transition-all duration-500 rounded-lg py-4 h-auto`}
                    onClick={handleGenerateClick}
                    disabled={!hasEnoughCredits}
                  >
                    {!hasEnoughCredits ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        <span className="whitespace-nowrap">Créditos insuficientes</span>
                      </>
                    ) : (
                      <>
                        <FiImage className="w-4 h-4 mr-2" />
                        <span className="whitespace-nowrap">Generar Anuncio ({REQUIRED_CREDITS} créditos)</span>
                      </>
                    )}
                  </Button>
                </DrawerClose>
              </div>
              
              <div className="col-span-1">
                <DrawerClose className="w-full">
                  <Button 
                    variant="outline" 
                    className="rounded-lg py-4 h-auto flex items-center justify-center"
                    onClick={onEdit}
                  >
                    <FiEdit className="w-5 h-5" />
                  </Button>
                </DrawerClose>
              </div>
            </div>

            {/* Mostrar mensaje de recarga de créditos cuando son insuficientes */}
            {insufficientCredits && (
              <div className="px-4 pt-4 text-sm text-center">
                <p className="text-gray-600">
                  Necesitas {REQUIRED_CREDITS} créditos para generar un anuncio.
                </p>
                <Button
                  variant="link"
                  className="text-blue-500 hover:text-blue-600 p-0 mt-1"
                  onClick={() => {
                    // Aquí se podría redirigir a la página de recarga de créditos
                    console.log("Redirigir a recarga de créditos");
                    // Ejemplo: router.push('/recargar-creditos')
                  }}
                >
                  Recargar créditos
                </Button>
              </div>
            )}
            
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}