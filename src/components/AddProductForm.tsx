import { useState, useRef } from 'react';
import { useProduct } from '@/context/ProductContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, AlertCircle, Wand2, Download, Camera, Image as ImageIcon } from 'lucide-react';
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

const MAX_FILE_SIZE = (3 * 1024 * 1024);
const REQUIRED_CREDITS = 50;

const AddProductForm = ({ open, onOpenChange }: AddProductFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [includeModel, setIncludeModel] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const { generateProductAndImage } = useProduct();
  const [currentAdImageUrl, setCurrentAdImageUrl] = useState<string | null>(null);
  const [generatedProductName, setGeneratedProductName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [modificationPrompt, setModificationPrompt] = useState<string>('');
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    if (!currentAdImageUrl) return;
    try {
      const response = await fetch(currentAdImageUrl);
      if (!response.ok) throw new Error('Network response was not ok.');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const filename = `generated_${generatedProductName || 'image'}_${Date.now()}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error("Failed to download image.");
    }
  };

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
          let quality = 0.9;
          let output = canvas.toDataURL('image/jpeg', quality);
          while (output.length > maxSizeMB * 1024 * 1024 * 1.33 && quality > 0.3) {
            quality -= 0.1;
            output = canvas.toDataURL('image/jpeg', quality);
          }
          const binary = atob(output.split(',')[1]);
          const array = [];
          for (let i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
          }
          const newFileName = file.name.replace(/\.[^/.]+$/, "") + "_compressed.jpg";
          const compressedFile = new File([new Uint8Array(array)], newFileName, { type: 'image/jpeg' });
          setIsCompressing(false);
          resolve(compressedFile);
        };
        img.onerror = () => {
          setIsCompressing(false);
          reject(new Error('Error loading image'));
        };
      };
      reader.onerror = () => {
        setIsCompressing(false);
        reject(new Error('Error reading file'));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileSize(file.size);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          setOriginalImageUrl(reader.result as string);
          setImagePreview(reader.result as string);
        }
      };
      if (file.size > MAX_FILE_SIZE) {
        try {
          setIsCompressing(true);
          const compressedFile = await compressImage(file);
          setFileSize(compressedFile.size);
          setImageFile(compressedFile);
          const readerCompressed = new FileReader();
          readerCompressed.readAsDataURL(compressedFile);
          readerCompressed.onload = () => {
            if (readerCompressed.result) {
              setOriginalImageUrl(readerCompressed.result as string);
              setImagePreview(readerCompressed.result as string);
            }
            setIsCompressing(false);
          };
        } catch (error) {
          console.error("Error compressing image:", error);
          setIsCompressing(false);
        }
      } else {
        setImageFile(file);
      }
      if (user) setInsufficientCredits(user?.credits < REQUIRED_CREDITS);
    } else {
      setImageFile(null);
      setImagePreview(null);
      setOriginalImageUrl(null);
      setFileSize(0);
      setInsufficientCredits(false);
    }
  };

  const handleGenerateClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && user?.credits < REQUIRED_CREDITS) {
      setInsufficientCredits(true);
      return;
    }
    if (!imageFile) {
      console.error("No image selected.");
      return;
    }
    setIsLoading(true);
    try {
      const imageBase64 = await toBase64(imageFile);
      const result = await generateProductAndImage(imageBase64, includeModel);
      setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
      setIsLoading(false);
      setCurrentAdImageUrl(result.generatedImageUrl);
      setGeneratedProductName(result.name);
      setIncludeModel(false);
      setFileSize(0);
      setInsufficientCredits(false);
      setCurrentImageId(result.imageId);
    } catch (error) {
      console.error("Error generating product and image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModifyImage = async () => {
    if (!modificationPrompt) {
      toast.error('Please enter modification instructions.');
      return;
    }
    setIsModifying(true);
    try {
      const response = await fetch(`https://api.tiendia.app/api/products/images/modify/${currentImageId}`, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: modificationPrompt }),
      });
      if (!response.ok) throw new Error(`Modification request failed: ${response.status}`);
      const result = await response.json();
      if (result && result.modifiedImageUrl) {
        setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
        setCurrentAdImageUrl(result.modifiedImageUrl);
        setCurrentImageId(result.imageId);
        toast.success('Image modified successfully!');
      } else {
        toast.error('Failed to retrieve modified image.');
      }
    } catch (error) {
      console.error("Error modifying ad:", error);
      toast.error('Error modifying image.');
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
    setOriginalImageUrl(null);
    setIncludeModel(false);
    setIsLoading(false);
    setIsCompressing(false);
    setCurrentAdImageUrl(null);
    setGeneratedProductName(null);
    setFileSize(0);
    setInsufficientCredits(false);
    setModificationPrompt('');
    setCurrentImageId(null);
    stopCamera();
    setIsCameraActive(false);
    setIsCapturing(false);
  };

  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(error => {
            console.error("Error playing video:", error);
            toast.error("Error al iniciar la cámara");
          });
        };
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = async () => {
    if (!videoRef.current) return;
    
    setIsCapturing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
          handleFileChange({ target: { files: [file] } } as any);
          stopCamera();
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error("Error capturing image:", error);
      toast.error("Error al capturar la imagen");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm();
      onOpenChange(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-5 w-5 mr-2" />
          Agregar Producto con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-0 overflow-hidden">
        {currentAdImageUrl && generatedProductName ? (
          <>
            <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-500" />
                Producto Generado
              </DialogTitle>
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Compara el antes y el después
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">{generatedProductName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <h4 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Antes</h4>
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={originalImageUrl || ''}
                        alt="Imagen Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <h4 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Después ✨</h4>
                    {isModifying && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                          <p className="text-xs text-blue-600 dark:text-blue-300">Modificando...</p>
                        </div>
                      </div>
                    )}
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                      <img
                        src={currentAdImageUrl}
                        alt="Imagen Generada"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modification-prompt" className="text-sm font-medium">Instrucciones para modificar (opcional):</Label>
                    <Textarea
                      id="modification-prompt"
                      placeholder="Ej: Cambia el fondo a una playa..."
                      value={modificationPrompt}
                      onChange={(e) => setModificationPrompt(e.target.value)}
                      className="min-h-[80px] bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      disabled={isModifying}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Costo: 50 créditos por modificación.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
                    <Button
                      onClick={handleModifyImage}
                      disabled={!modificationPrompt || isModifying}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-4 py-2 rounded-lg"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Modificar Imagen
                    </Button>
                    <Button
                      onClick={handleDownloadImage}
                      variant="outline"
                      disabled={isModifying}
                      className="w-full sm:w-auto border-gray-300 dark:border-gray-600"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                className="w-full sm:w-auto border-gray-300 dark:border-gray-600"
              >
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50">Generar Producto con IA</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4">
                {insufficientCredits && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      No tienes suficientes créditos. Se requieren {REQUIRED_CREDITS} créditos.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="text-sm font-medium">Sube la imagen del producto</Label>
                  {isCameraActive ? (
                    <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        style={{ transform: 'scaleX(-1)' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex justify-center gap-4">
                          <Button
                            variant="outline"
                            onClick={stopCamera}
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-white/30"
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={captureImage}
                            disabled={isCapturing}
                            className="w-16 h-16 rounded-full bg-white hover:bg-white/90 transition-all duration-200 flex items-center justify-center"
                          >
                            {isCapturing ? (
                              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
                            ) : (
                              <div className="w-14 h-14 rounded-full border-4 border-gray-600" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="aspect-[4/3] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col items-center justify-center p-4"
                        onClick={startCamera}
                      >
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Usar Cámara 2</span>
                      </div>
                      <div
                        className="aspect-[4/3] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col items-center justify-center p-4"
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Galería</span>
                        <input
                          id="image-upload"
                          name="imageFile"
                          type="file"
                          className="sr-only"
                          accept="image/png, image/jpeg, image/webp"
                          onChange={handleFileChange}
                          disabled={isCompressing}
                        />
                      </div>
                    </div>
                  )}
                  {imagePreview && !isCameraActive && (
                    <div className="mt-4">
                      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Previsualización"
                          className="w-full h-full object-contain"
                        />
                        {fileSize > 0 && (
                          <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full text-center">
                            {formatFileSize(fileSize)} {fileSize > MAX_FILE_SIZE ? '(Comprimida)' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {imagePreview && !isCameraActive && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
                      className={`${hasEnoughCredits ? "bg-gradient-to-r from-blue-500 to-cyan-400" : "bg-gray-400"} transition-all duration-500 text-white flex-1`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Generando...
                        </>
                      ) : !hasEnoughCredits ? (
                        <>
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Créditos insuficientes
                        </>
                      ) : (
                        <>
                          <FiImage className="w-4 h-4 mr-2" />
                          Generar ({REQUIRED_CREDITS} créditos)
                        </>
                      )}
                    </Button>
                  </div>
                )}
                {insufficientCredits && (
                  <div className="mt-3 text-sm text-center">
                    <p className="text-gray-600">
                      Necesitas {REQUIRED_CREDITS} créditos para generar una imagen.
                    </p>
                    <Button
                      variant="link"
                      className="text-blue-500 hover:text-blue-600 p-0 mt-1"
                      onClick={() => navigate("/credits")}
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