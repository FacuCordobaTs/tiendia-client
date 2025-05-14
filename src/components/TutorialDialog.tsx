// src/components/TutorialDialog.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react'; // Import icons

interface TutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const slides = [
  {
    title: "Paso 1: Créditos",
    description: "Al registrarte, recibiste 500 créditos gratis. Cada imagen generada consume 50 créditos. Si necesitas más, puedes cargarlos fácilmente desde la sección 'Cargar Créditos'.",
    image: "/placeholder-credits.png" // Placeholder image path
  },
  {
    title: "Paso 2: Añadir Producto",
    description: "Añade tu primer producto haciendo clic en 'Añadir Producto'. Sube una imagen clara de tu artículo. Una vez subido, ¡estarás listo para generar tu primera fotografia profesional!",
    image: "/placeholder-upload.png" // Placeholder image path
  },
  {
    title: "Paso 3: Generar Imágenes",
    description: "Encuentra tu producto en la lista y haz clic en 'Generar Imágenes'. ¡Experimenta para obtener los mejores resultados!",
    image: "/placeholder-generate.png" // Placeholder image path
  },
  {
    title: "Paso 4: Tus Imágenes",
    description: "Todas las imágenes que generes se guardarán automáticamente. Puedes verlas, descargarlas o eliminarlas desde la sección 'Imágenes' en el menú lateral.",
    image: "/placeholder-gallery.png" // Placeholder image path
  }
];

const TutorialDialog: React.FC<TutorialDialogProps> = ({ open, onOpenChange }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Last slide action: close dialog
      handleClose();
    }
  };

  const handleClose = () => {
    setCurrentSlide(0); // Reset slide index when closing
    onOpenChange(false);
  };

  // Ensure dialog doesn't try to render when closed
  if (!open) return null;

  const slide = slides[currentSlide];

  return (
    <Dialog open={open} onOpenChange={handleClose}> {/* Use handleClose for X button and overlay click */} 
      <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{slide.title}</DialogTitle>
          <DialogDescription className="mt-2">
            {slide.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-4 flex-1 flex items-center justify-center overflow-hidden">
          {/* Placeholder for image - replace with actual image rendering */}
          <div className="w-full rounded-md flex items-center justify-center">
            {/* <span className="text-gray-500">[Imagen para {slide.title}]</span> */}
            <img src={slide.image} alt={slide.title} className="max-h-full max-w-full object-contain rounded-md" />
          </div>
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
           {/* Progress Indicator */}
           <div className="text-sm text-muted-foreground">
             Paso {currentSlide + 1} de {slides.length}
           </div>
           
           {/* Navigation Button */}
           <Button onClick={handleNext}>
             {currentSlide < slides.length - 1 ? 'Siguiente' : 'Entendido'}
             {currentSlide < slides.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
           </Button>
        </DialogFooter>
         {/* Optional: Add a close button inside if needed, though Dialog usually has one */}
         {/* <Button variant="ghost" size="icon" onClick={handleClose} className="absolute top-4 right-4">
           <X className="h-4 w-4" />
         </Button> */}
      </DialogContent>
    </Dialog>
  );
};

export default TutorialDialog;