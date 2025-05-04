import { useState } from 'react';
import { useProduct } from '@/context/ProductContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, AlertCircle, Wand2, Download } from 'lucide-react';
import { FaCloudUploadAlt } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiImage } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { Textarea } from './ui/textarea';

export interface Product {
  id: number;
  imageURL: string | null;
  name: string;
}

export interface AddProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Tamaño máximo permitido en bytes (3MB)
const MAX_FILE_SIZE = (3 * 1024 * 1024);
// Créditos necesarios para generar una imagen
const REQUIRED_CREDITS = 50;

const AddProductForm = ({ open, onOpenChange }: AddProductFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [includeModel, setIncludeModel] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const { generateProductAndImage } = useProduct();
  const [currentAdImageUrl, setCurrentAdImageUrl] = useState<string | null>(null);
  const [generatedProductName, setGeneratedProductName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>(''); // Estado para el prompt de modificación
  const [isModifying, setIsModifying] = useState<boolean>(false); // Estado para indicar si se está modificando
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);

  const { user, setUser } = useAuth();

  const navigate = useNavigate();

  const toBase64 = (file: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  const handleDownloadImage = async () => {
    if (!currentAdImageUrl) return; // No hacer nada si no hay URL

    try {
      const response = await fetch(currentAdImageUrl); // Usa la URL completa
      if (!response.ok) throw new Error('La respuesta de red no fue correcta.');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      // Intenta obtener un nombre de archivo de la URL o usa uno genérico
      const filename = currentAdImageUrl.split('/').pop() || `imagen-generada-${Date.now()}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl); // Limpiar memoria
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      // Mostrar un toast/alerta de error al usuario
      alert("Error al descargar la imagen."); // Reemplaza con un toast si prefieres
    }
  };


  // Función para comprimir imagen
  const compressImage = (file: File, maxSizeMB: number = 1): Promise<File> => {
    return new Promise((resolve, reject) => {
      setIsCompressing(true);
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
          
          setIsCompressing(false);
          resolve(compressedFile);
        };
        img.onerror = () => {
          setIsCompressing(false);
          reject(new Error('Error al cargar la imagen'));
        };
      };
      reader.onerror = () => {
        setIsCompressing(false);
        reject(new Error('Error al leer el archivo'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileSize(file.size);
      
      // Si el archivo es mayor que el tamaño máximo, comprimir
      if (file.size > MAX_FILE_SIZE) {
        try {
          setIsCompressing(true);
          const compressedFile = await compressImage(file);
          setFileSize(compressedFile.size);
          setImageFile(compressedFile);
          
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onload = () => {
            if (reader.result) setImagePreview(reader.result as string);
            setIsCompressing(false);
          };
        } catch (error) {
          console.error("Error al comprimir la imagen:", error);
          setIsCompressing(false);
        }
      } else {
        // Si es menor que el tamaño máximo, usar el archivo original
        setImageFile(file);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          if (reader.result) setImagePreview(reader.result as string);
        };
      }

      // Verificar créditos al seleccionar una imagen
      if (user)
        setInsufficientCredits(user?.credits < REQUIRED_CREDITS);
    } else {
      setImageFile(null);
      setImagePreview(null);
      setFileSize(0);
      setInsufficientCredits(false);
    }
  };

  const handleGenerateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar si el usuario tiene suficientes créditos
    if (user && user?.credits < REQUIRED_CREDITS) {
      setInsufficientCredits(true);
      return;
    }
    
    if (!imageFile) {
      console.error("No se ha seleccionado ninguna imagen.");
      return;
    }
    
    setIsLoading(true);
    try {
      const imageBase64 = await toBase64(imageFile);
      const result = await generateProductAndImage(imageBase64, includeModel);
      setUser(prevUser => ( 
        prevUser ? { ...prevUser, credits: prevUser.credits -50} : null
        )
      );
      setIsLoading(false);
      setCurrentAdImageUrl(result.generatedImageUrl);
      setGeneratedProductName(result.name);
      setImageFile(null);
      setImagePreview(null);
      setIncludeModel(false);
      setFileSize(0);
      setInsufficientCredits(false);
      setCurrentImageId(result.imageId)
    } catch (error) {
      console.error("Error al generar producto e imagen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyImage = async () => {
    if (!modificationPrompt) {
      toast.error('Por favor, ingresa las instrucciones para modificar la imagen.');
      return;
    }

    setIsModifying(true);
    try {
      const response = await fetch(`https://api.tiendia.app/api/products/images/modify/${currentImageId}`, {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: modificationPrompt }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Detalles del error de modificación:", errorBody);
        throw new Error(`Error en la solicitud de modificación: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result && result.modifiedImageUrl) {
        console.log("URL de imagen modificada recibida:", result.modifiedImageUrl);
        // Asumiendo que la modificación también consume créditos
        setUser(prevUser => (
          prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null // Ajustar costo si es diferente
        ));
        setCurrentAdImageUrl(result.modifiedImageUrl);
        setCurrentImageId(result.imageId)
        toast.success('¡Imagen modificada con éxito!');
      } else {
        console.error("La respuesta de la API no contiene 'modifiedImageUrl'. Respuesta:", result);
        toast.error('Error al obtener la imagen modificada.');
      }
    } catch (error) {
      console.error("Error al modificar el anuncio:", error);
      toast.error('Ocurrió un error al intentar modificar la imagen.');
    } finally {
      setIsModifying(false);
    }
  };


  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setIncludeModel(false);
    setIsLoading(false);
    setIsCompressing(false);
    setCurrentAdImageUrl(null);
    setGeneratedProductName(null);
    setFileSize(0);
    setInsufficientCredits(false);
  };

  // Verificar si el usuario tiene suficientes créditos
  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-5 w-5 mr-2" />
          Agregar Producto con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full sm:max-w-[500px] max-h-[90vh] overflow-hidden">
        {currentAdImageUrl && generatedProductName ? (
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Producto Generado</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-4 py-3">
                <h3 className="text-lg font-semibold">{generatedProductName}</h3>
                <img 
                  src={"https://api.tiendia.app"+currentAdImageUrl} 
                  alt="Imagen Generada" 
                  className="w-full h-auto rounded-lg max-h-[50vh] object-contain" 
                />
              {currentAdImageUrl && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Campo para instrucciones de modificación */}
                  <div className="space-y-2">
                    <label htmlFor="modification-prompt" className="text-sm font-medium">Instrucciones para modificar (opcional):</label>
                    <Textarea
                      id="modification-prompt"
                      placeholder="Ej: Cambia el fondo a una playa, haz el producto más grande..."
                      value={modificationPrompt}
                      onChange={(e) => setModificationPrompt(e.target.value)}
                      className="min-h-[80px]"
                      disabled={isModifying} // Deshabilitar mientras se modifica
                    />
                    <p className="text-xs text-muted-foreground">Costo de modificación: 50 créditos.</p>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-between items-center">
                    <Button
                      onClick={handleModifyImage}
                      disabled={!modificationPrompt || isModifying} // Deshabilitar si no hay prompt o si ya se está modificando
                      className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Modificar Imagen
                    </Button>
                    <Button
                      onClick={handleDownloadImage}
                      variant="outline"
                      disabled={isModifying} // Deshabilitar mientras se modifica
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              )}

                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => {
                    resetForm();
                    onOpenChange(false);
                  }}
                  className="mt-2"
                >
                  Cerrar
                </Button>
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div>
            <DialogHeader>
              <DialogTitle className="text-xl sm:text-2xl">Generar Producto con IA</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] overflow-y-auto pr-2">
              <div className="grid gap-4 py-3">
                {/* Mostrar información de créditos */}
                <div className="text-sm text-gray-600 flex justify-between items-center">
                  <span>Créditos disponibles:</span>
                  <span className={`font-semibold ${hasEnoughCredits ? 'text-green-600' : 'text-red-500'}`}>
                    {user?.credits || 0} / {REQUIRED_CREDITS} necesarios
                  </span>
                </div>
                
                {insufficientCredits && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      No tienes suficientes créditos para generar una imagen. Se requieren {REQUIRED_CREDITS} créditos.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="text-sm font-medium">Sube la imagen del producto</Label>
                  <div
                    className={`mt-1 flex justify-center px-4 pt-4 pb-4 border-2 ${isCompressing ? 'border-yellow-300' : imagePreview ? 'border-blue-300' : 'border-gray-300 border-dashed'} rounded-md hover:border-blue-400 cursor-pointer transition-colors relative`}
                    onClick={() => !isCompressing && document.getElementById('image-upload')?.click()}
                  >
                    {isCompressing ? (
                      <div className="flex flex-col items-center justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mb-2" />
                        <p className="text-sm text-gray-600">Comprimiendo imagen...</p>
                      </div>
                    ) : imagePreview ? (
                      <div className="flex flex-col items-center">
                        <img src={imagePreview} alt="Previsualización" className="max-h-40 w-auto object-contain rounded" />
                        {fileSize > 0 && (
                          <span className="text-xs mt-2 text-gray-500">
                            {formatFileSize(fileSize)} {fileSize > MAX_FILE_SIZE ? '(Comprimida)' : ''}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1 text-center">
                        <FaCloudUploadAlt className="mx-auto h-10 w-10 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <span className="relative bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Haz clic para subir</span>
                            <input
                              id="image-upload"
                              name="imageFile"
                              type="file"
                              className="sr-only"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleFileChange}
                              disabled={isCompressing}
                            />
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, WEBP hasta 3MB</p>
                        <p className="text-xs text-gray-400">(Las imágenes más grandes se comprimirán automáticamente)</p>
                      </div>
                    )}
                  </div>
                </div>
                {imagePreview && !isCompressing && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Preferencias de Imagen</h3>
                    <Button
                      onClick={() => setIncludeModel(!includeModel)}
                      variant="outline"
                      disabled={isLoading}
                      className={`w-full rounded-lg transition-all px-3 py-3 h-auto flex flex-row items-center text-left ${includeModel ? 'bg-gradient-to-r from-orange-500 to-red-400 text-white hover:text-white border-transparent' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                    >
                      <div className={`w-6 h-6 rounded-full ${includeModel ? 'bg-white/30' : 'bg-amber-100'} flex items-center justify-center mr-2 flex-shrink-0`}>
                        <span className={includeModel ? 'text-white' : 'text-amber-500'}>☀️</span>
                      </div>
                      <span className="font-medium flex-grow">Incluir un fondo neutro</span>
                      {includeModel && <span className="ml-auto text-xs font-semibold">(Activado)</span>}
                    </Button>
                  </div>
                )}
                {imagePreview && !isCompressing && (
                  <div className="flex gap-2 pt-2">

                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isLoading} 
                      onClick={() => {
                        onOpenChange(false);
                        resetForm();
                      }}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      disabled={isLoading || !imageFile || !hasEnoughCredits}
                      onClick={handleGenerateClick}
                      className={`${hasEnoughCredits 
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-400 dark:to-cyan-300" 
                        : "bg-gray-400"} transition-all duration-500 text-white flex-1`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span className="whitespace-nowrap">Generando...</span>
                        </>
                      ) : !hasEnoughCredits ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          <span className="whitespace-nowrap">Créditos insuficientes</span>
                        </>
                      ) : (
                        <>
                          <FiImage className="w-4 h-4 mr-2" />
                          <span className="whitespace-nowrap">Generar ({REQUIRED_CREDITS} créditos)</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Mostrar mensaje de recarga de créditos cuando son insuficientes */}
                {insufficientCredits && (
                  <div className="mt-3 text-sm text-center">
                    <p className="text-gray-600">
                      Necesitas {REQUIRED_CREDITS} créditos para generar una imagen.
                    </p>
                    <Button
                      variant="link"
                      className="text-blue-500 hover:text-blue-600 p-0 mt-1"
                      onClick={() => {
                        navigate("/credits")
                        // Ejemplo: router.push('/recargar-creditos')
                      }}
                    >
                      Recargar créditos
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddProductForm;