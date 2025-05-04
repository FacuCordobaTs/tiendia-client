import { useState, useEffect } from 'react';
import { useProduct } from '@/context/ProductContext';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from 'lucide-react';
import { FaCloudUploadAlt } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Product {
  id: number;
  imageURL: string | null;
  name: string;
}

export interface AddProductFormProps { 
  initialValues: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProductForm = ({ initialValues, open, onOpenChange }: AddProductFormProps) => {
  const [formValues, setFormValues] = useState({
    name: '',
    imageFile: null as File | null,
  });
  const { updateProduct, deleteProduct } = useProduct();
  const [state, setState] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Tamaño máximo permitido en bytes (3MB)
  const MAX_FILE_SIZE = (3 * 1024 * 1024);

  const toBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const readFile = (file: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        setImagePreview(reader.result as string);
      }
    };
  };

  // Función para comprimir imagen
  const compressImage = (file: File, maxSizeMB: number = 1): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Mantener la relación de aspecto y limitar el tamaño
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height && width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Iniciar con calidad alta y reducir si es necesario
          let quality = 0.9;
          let output = canvas.toDataURL('image/jpeg', quality);
          
          // Reducir calidad hasta que el tamaño sea menor que el máximo
          while (output.length > maxSizeMB * 1024 * 1024 * 1.33 && quality > 0.3) {
            quality -= 0.1;
            output = canvas.toDataURL('image/jpeg', quality);
          }
          
          // Convertir base64 a blob
          const binary = atob(output.split(',')[1]);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          
          const newFileName = file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg";
          const compressedFile = new File([new Uint8Array(array)], newFileName, {
            type: 'image/jpeg'
          });
          
          resolve(compressedFile);
        };
        img.onerror = () => {
          reject(new Error('Error al cargar la imagen'));
        };
      };
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo'));
      };
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Si el archivo es mayor que el tamaño máximo, comprimir
      if (file.size > MAX_FILE_SIZE) {
        try {
          setIsLoading(true);
          const compressedFile = await compressImage(file);
          readFile(compressedFile);
          setFormValues({ ...formValues, imageFile: compressedFile });
          setIsLoading(false);
        } catch (error) {
          console.error("Error al comprimir la imagen:", error);
          setIsLoading(false);
        }
      } else {
        // Si es menor que el tamaño máximo, usar el archivo original
        readFile(file);
        setFormValues({ ...formValues, imageFile: file });
      }
      setState(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (initialValues) {
        if (formValues.imageFile) {
          const imageBase64 = await toBase64(formValues.imageFile);
          await updateProduct(
            initialValues.id,
            formValues.name,
            imageBase64,
          );
        }
        else {
          await updateProduct(
            initialValues.id,
            formValues.name,
            undefined,
          );
        } 
      } 
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteProduct(initialValues.id);
      onOpenChange(false);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (open && initialValues) {
      setFormValues({
        name: initialValues.name,
        imageFile: null,
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setFormValues({
        name: '',
        imageFile: null,
      });
      setState(false);
      setImagePreview(null);
    } else {
      if (initialValues) {
        setFormValues({
          name: initialValues.name,
          imageFile: null,
        });
        if (initialValues.imageURL) {
          setImagePreview(initialValues.imageURL);
          setState(true);
        }
      }
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>      
      <DialogContent className="w-full sm:max-w-[600px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {initialValues ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] overflow-y-auto pr-2">
          <form onSubmit={(e) => handleSubmit(e)} className="grid gap-4 py-3">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                placeholder="Nombre del producto"
                required
                autoFocus={false} // Evita la selección automática
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Imagen</Label>
              <div 
                className="cursor-pointer"
                onClick={() => document.getElementById('image')?.click()}
              >
                {state && imagePreview ? (
                  <div className="border rounded p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <img
                      src={imagePreview}
                      className="object-cover h-32 w-32 mx-auto rounded"
                      alt="Preview"
                    />
                    <p className="text-xs text-center mt-2 text-gray-500">Clic para cambiar imagen</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center bg-neutral-900 text-white rounded py-4 cursor-pointer hover:bg-neutral-800 transition-colors">
                    <FaCloudUploadAlt className="h-4 w-4 mr-2" /> 
                    <span>Seleccionar imagen</span>
                  </div>
                )}
              </div>
            </div>

            <input 
              type="file" 
              name="imageFile" 
              className="absolute invisible"
              id="image"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleImageChange}
            />

            {/* Botones móviles en columna */}
            <div className="grid grid-cols-1 gap-2 mt-4 sm:hidden">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : 'Actualizar Producto'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || isDeleting}
                onClick={() => onOpenChange(false)}
                className="w-full"
              >
                Cancelar
              </Button>
              
              <Button
                type="button"
                variant="destructive"
                disabled={isLoading || isDeleting}
                onClick={handleDelete}
                className="w-full"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Producto
                  </>
                )}
              </Button>
            </div>
            
            {/* Botones desktop en fila */}
            <div className="hidden sm:flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="destructive"
                disabled={isLoading || isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : 'Eliminar Producto'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                disabled={isLoading || isDeleting}
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              
              <Button 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : 'Actualizar Producto'}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductForm;