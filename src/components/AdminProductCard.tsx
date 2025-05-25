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
import { AlertCircle, Sparkles, Crown, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface Product {
  id: number;
  imageURL: string | null;
  name: string;
}

// Créditos necesarios para generar un anuncio
const REQUIRED_CREDITS = 50;
const REQUIRED_PRO_CREDITS = 100; // Double credits for Pro generation

export default function AdminProductCard({ product, handleGenerateAd, onEdit, updateGeneratedImage }: {
  product: Product;
  handleGenerateAd: (id: number, includeModel: boolean, originalImageUrl: string | null, isPro: boolean) => void;
  onEdit: () => void;
  updateGeneratedImage: (imageUrl: string) => void;
}) {
  const { name, imageURL } = product;
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'standard' | 'pro'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);

  // Obtener información del usuario actual
  const { user } = useAuth();

  // Verificar si el usuario tiene suficientes créditos
  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;
  const hasEnoughProCredits = user && user.credits >= REQUIRED_PRO_CREDITS;
  
  const handleGenerateClick = () => {
    console.log('🔄 Starting generation process:', { 
      selectedOption, 
      hasEnoughCredits: selectedOption === 'pro' ? hasEnoughProCredits : hasEnoughCredits,
      productId: product.id 
    });

    const hasCredits = selectedOption === 'pro' ? hasEnoughProCredits : hasEnoughCredits;
    
    if (!hasCredits) {
      console.log('❌ Insufficient credits for generation');
      setInsufficientCredits(true);
      return;
    }
    
    setInsufficientCredits(false);
  
    if (selectedOption === 'pro') {
      console.log('🚀 Starting Pro generation workflow');
      setIsGenerating(true);
      
      // Open the dialog first to show loading state
      console.log('📱 Opening generation dialog');
      handleGenerateAd(product.id, true, product.imageURL, true);
      
      // Use EventSource for Pro generation
      console.log('🔌 Establishing SSE connection for Pro generation');
      const eventSource = new EventSource(
        `https://api.tiendia.app/api/products/sse/generate-pro/${product.id}`,
        { withCredentials: true }
      );
  
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 Received SSE message:', data);
        
        if (data.status === "done") {
          console.log('✅ Pro generation completed successfully');
          // Update the UI with the generated image
          if (data.imageUrl) {
            console.log('🖼️ Updating UI with generated image:', data.imageUrl);
            updateGeneratedImage(data.imageUrl);
            // Close the loading toast
            toast.dismiss("generation-progress");
            toast.success('¡Imagen generada con éxito!');
          }
          setIsGenerating(false);
          eventSource.close();
        } else if (data.status === "error") {
          console.error('❌ Pro generation failed:', data.message);
          toast.dismiss("generation-progress");
          toast.error(data.message || "Error al generar la imagen");
          setIsGenerating(false);
          eventSource.close();
        } else if (data.status === "processing") {
          console.log('⏳ Generation progress:', data.message);
          // Show progress to user
          toast.loading(data.message || "Procesando imagen...", { id: "generation-progress" });
        }
      };
  
      eventSource.onerror = (error) => {
        console.error('🔌 SSE connection error:', error);
        toast.dismiss("generation-progress");
        toast.error("Error de conexión");
        setIsGenerating(false);
        eventSource.close();
      };
    } else {
      console.log('🚀 Starting Standard generation workflow');
      // Standard generation
      handleGenerateAd(product.id, true, product.imageURL, false);
    }
  };

  return (
    <Drawer onOpenChange={(open) => !open && setInsufficientCredits(false)}>
      <DrawerTrigger asChild>
        <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] h-full hover:cursor-pointer w-full md:max-w-[280px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="w-full border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <AspectRatio ratio={4 / 3}>
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105 p-2"
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

      <DrawerContent className="max-h-[95vh] bg-white dark:bg-gray-900">
        <div className="mx-auto w-full max-w-md p-4">
           <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-4" />

           <div className="rounded-lg overflow-hidden mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
            {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="w-full h-52 object-contain p-2 bg-gray-50 dark:bg-gray-800"
                />
              ) : (
                <div className="w-full h-52 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">Sin Imagen</div>
              )}
            </div>

            <div className="text-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  {product.name}
                </h2>
             </div>

           <div className="mb-5 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-300 flex justify-between items-center">
                <span>Imágenes disponibles:</span>
                 <span className={`font-semibold ${hasEnoughCredits ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                   {user?.credits != null ? (user.credits/50).toLocaleString('es-AR') : '0'}
                 </span>
              </div>
             <div className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1">
                 Necesarias para generar: {selectedOption === 'pro' ? '2 imágenes' : '1 imagen'}
             </div>
             {insufficientCredits && (
               <Alert variant="destructive" className="mt-3 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300">
                 <AlertCircle className="h-4 w-4" />
                 <AlertDescription className="text-xs">
                   No tienes suficientes imágenes.
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
             <div className="space-y-2">
               <Button
                 variant="outline"
                 className={`w-full rounded-lg transition-all px-4 py-3 h-auto flex items-center justify-between text-left border ${
                   selectedOption === 'standard' 
                     ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                     : 'border-gray-300 dark:border-gray-600'
                 }`}
                 onClick={() => setSelectedOption('standard')}
               >
                 <div className="flex items-center">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-colors ${
                     selectedOption === 'standard' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                   }`}>
                     {selectedOption === 'standard' && (
                       <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                       </svg>
                     )}
                   </div>
                   <span className={`font-medium text-sm ${
                     selectedOption === 'standard' 
                       ? 'text-blue-800 dark:text-blue-200' 
                       : 'text-gray-700 dark:text-gray-300'
                   }`}>Estándar (1 imagen)</span>
                 </div>
               </Button>

               {user?.email === "facucordoba200@gmail.com" && <Button
                 variant="outline"
                 className={`w-full rounded-lg transition-all px-4 py-3 h-auto flex items-center justify-between text-left border ${
                   selectedOption === 'pro' 
                     ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                     : 'border-gray-300 dark:border-gray-600'
                 }`}
                 onClick={() => setSelectedOption('pro')}
               >
                 <div className="flex items-center">
                   <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-colors ${
                     selectedOption === 'pro' ? 'bg-purple-500' : 'bg-gray-200 dark:bg-gray-700'
                   }`}>
                     {selectedOption === 'pro' && (
                       <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                       </svg>
                     )}
                   </div>
                   <div className="flex items-center">
                     <span className={`font-medium text-sm ${
                       selectedOption === 'pro' 
                         ? 'text-purple-800 dark:text-purple-200' 
                         : 'text-gray-700 dark:text-gray-300'
                     }`}>Pro (2 imágenes)</span>
                     <Crown className="w-4 h-4 ml-2 text-yellow-500" />
                   </div>
                 </div>
               </Button>}
             </div>
           </div>

          <div className="grid grid-cols-5 gap-3">
              <DrawerClose className="w-full col-span-4">
                <Button
                  className={`w-full transition-all duration-300 rounded-lg py-3 h-auto text-sm font-semibold flex items-center justify-center gap-2 ${
                   (selectedOption === 'pro' ? hasEnoughProCredits : hasEnoughCredits)
                     ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md hover:shadow-lg'
                     : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                 }`}
                  onClick={handleGenerateClick}
                  disabled={!imageURL || (selectedOption === 'pro' ? !hasEnoughProCredits : !hasEnoughCredits) || isGenerating}
                >
                 {!imageURL ? (
                    <>
                     <AlertCircle className="w-4 h-4" />
                     <span>Falta Imagen</span>
                    </>
                  ) : (selectedOption === 'pro' ? !hasEnoughProCredits : !hasEnoughCredits) ? (
                    <>
                     <AlertCircle className="w-4 h-4" />
                      <span>No te quedan imágenes disponibles</span>
                   </>
                 ) : isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generando...</span>
                    </>
                 ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generar ({selectedOption === 'pro' ? '2' : '1'} imagen)</span>
                    </>
                 )}
                </Button>
              </DrawerClose>

            <DrawerClose className="w-full col-span-1">
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