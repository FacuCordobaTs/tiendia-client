import { useState, useRef } from 'react';
import { useProduct } from '@/context/ProductContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, AlertCircle, Wand2, Download, Camera, Image as ImageIcon, Upload } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiImage } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';

export interface Product {
  id: number;
  imageURL: string | null;
  name: string;
}

export interface AddProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = (1 * 1024 * 1024);
const REQUIRED_CREDITS = 50;

const AddProductForm = ({ open, onOpenChange }: AddProductFormProps) => {
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const { generateProductAndImage, uploadProducts } = useProduct();
  const [currentAdImageUrl, setCurrentAdImageUrl] = useState<string | null>(null);
  const [generatedProductName, setGeneratedProductName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);


  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      const noCacheUrl = `${currentAdImageUrl}?t=${Date.now()}`;
      const response = await fetch(noCacheUrl);
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
    if (e.target && e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setFileSize(files.reduce((acc, file) => acc + file.size, 0));
      
      const newPreviews: string[] = [];
      const newFiles: File[] = [];
      
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          try {
            setIsCompressing(true);
            const compressedFile = await compressImage(file);
            newFiles.push(compressedFile);
            const readerCompressed = new FileReader();
            readerCompressed.readAsDataURL(compressedFile);
            readerCompressed.onload = () => {
              if (readerCompressed.result) {
                newPreviews.push(readerCompressed.result as string);
                setImagePreviews([...newPreviews]);
              }
            };
          } catch (error) {
            console.error("Error compressing image:", error);
          }
        } else {
          newFiles.push(file);
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            if (reader.result) {
              newPreviews.push(reader.result as string);
              setImagePreviews([...newPreviews]);
            }
          };
        }
      }
      
      setImageFiles(newFiles);
      if (user) setInsufficientCredits(user?.credits < REQUIRED_CREDITS);
    } else {
      setImageFiles([]);
      setImagePreviews([]);
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
    if (!imageFiles.length) {
      console.error("No images selected.");
      return;
    }
    setIsLoading(true);
    try {
      const imageBase64 = await toBase64(imageFiles[0]);
      const result = await generateProductAndImage(imageBase64, true);
      setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
      setIsLoading(false);
      setCurrentAdImageUrl(result.generatedImageUrl);
      setGeneratedProductName(result.name);
      setFileSize(0);
      setInsufficientCredits(false);
    } catch (error) {
      console.error("Error generating product and image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadImages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFiles.length) return;
    
    setIsLoading(true);
    try {
      await uploadProducts(imageFiles);
      toast.success('Imágenes subidas correctamente');
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Error al subir las imágenes");
    } finally {
      setIsLoading(false);
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
    setImageFiles([]);
    setImagePreviews([]);
    setIsLoading(false);
    setIsCompressing(false);
    setCurrentAdImageUrl(null);
    setGeneratedProductName(null);
    setFileSize(0);
    setInsufficientCredits(false);
    stopCamera();
    setIsCameraActive(false);
    setIsCapturing(false);
  };

  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access not supported by your browser");
      return;
    }

    try {
      setCameraPermissionDenied(false);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraPermissionDenied(true);
      toast.error("Camera access denied. Please allow access to your camera.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Match canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame to the canvas
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFileSize(file.size);
        setImageFiles([file]);
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          if (reader.result) {
            const dataUrl = reader.result as string;
            setImagePreviews([dataUrl]);
            
            // Stop the camera and switch to preview
            stopCamera();
            
            // Automatically start generation
            handleGenerateClick(new Event('click') as unknown as React.FormEvent);
          }
        };
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.9);
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <h4 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Antes</h4>
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[400px] max-w-[400px] mx-auto">
                      <img
                        src={imagePreviews[0] || ''}
                        alt="Imagen Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="relative">
                    <h4 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Después ✨</h4>
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[400px] max-w-[400px] mx-auto">
                      <img
                        src={currentAdImageUrl}
                        alt="Imagen Generada"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 flex-shrink-0">
              <Button
                onClick={handleDownloadImage}
                variant="outline"
                className="w-full sm:w-auto border-gray-300 dark:border-gray-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50">Generar Producto con IA</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid gap-4">
                {insufficientCredits && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <AlertDescription>
                      No tienes suficientes imágenes.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="text-sm font-medium">Sube la imagen del producto</Label>
                  {isCameraActive ? (
                    cameraPermissionDenied ? (
                      <div className="text-center p-6">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-white text-lg mb-4">Acceso a la cámara denegado</p>
                        <p className="text-gray-300 text-sm mb-6">Para usar esta función, por favor permite el acceso a la cámara en la configuración de tu navegador.</p>
                        <Button 
                          onClick={() => {
                            setCameraPermissionDenied(false);
                            startCamera();
                          }}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          Reintentar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="h-full w-full object-cover rounded-lg"
                          style={{ display: isCameraActive ? 'block' : 'none' }}
                        />
                        
                        <canvas 
                          ref={canvasRef} 
                          className="hidden"
                        />
                        
                        {isCameraActive && (
                          <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                            <Button
                              onClick={captureImage}
                              disabled={isCapturing}
                              className="rounded-full w-16 h-16 p-0 border-4 border-white bg-white bg-opacity-20 backdrop-blur-sm hover:bg-opacity-30 transition-all"
                            >
                              {isCapturing ? (
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                              ) : (
                                <div className="rounded-full w-12 h-12 bg-white"></div>
                              )}
                            </Button>
                          </div>
                        )}
                        
                        {!isCameraActive && !isLoading && (
                          <div className="text-center p-8">
                            <Camera className="h-16 w-16 text-gray-300 mx-auto mb-6" />
                            <p className="text-gray-300 text-lg mb-8">Activa la cámara para tomar una foto</p>
                            <Button 
                              onClick={startCamera}
                              className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-3 rounded-full font-medium"
                            >
                              <Camera className="h-5 w-5 mr-2" />
                              Activar Cámara
                            </Button>
                          </div>
                        )}
                        
                        {isLoading && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-400 mb-4" />
                            <p className="text-lg text-white font-medium">Generando imagen...</p>
                            <p className="text-sm text-gray-300 mt-2">Esto puede tomar unos momentos</p>
                          </div>
                        )}
                      </>
                    )
                    
                  ) : (
                    !imagePreviews.length &&
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="aspect-[4/3] bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex flex-col items-center justify-center p-4"
                        onClick={startCamera}
                      >
                        <Camera className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Usar Cámara</span>
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
                          multiple
                        />
                      </div>
                    </div>
                  )}
                  {imagePreviews.length > 0 && !isCameraActive && (
                    <div className="mt-4">
                      <ScrollArea className={`${imagePreviews.length === 1 ? '' : 'max-h-[400px]'}`}>
                        <div className={`grid ${imagePreviews.length === 1 ? 'grid-cols-1 max-w-[600px] mx-auto' : 'grid-cols-2 sm:grid-cols-3'} gap-4 p-1`}>
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden max-h-[400px]">
                              <img
                                src={preview}
                                alt={`Previsualización ${index + 1}`}
                                className="w-full h-full object-contain max-h-[400px]"
                              />
                              {fileSize > 0 && index === 0 && (
                                <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full text-center">
                                  {formatFileSize(fileSize)} {fileSize > MAX_FILE_SIZE ? '(Comprimida)' : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                {imagePreviews.length > 0 && !isCameraActive && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      type="button"
                      disabled={isLoading}
                      onClick={handleUploadImages}
                      className=" flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Subiendo...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Subir {imagePreviews.length} {imagePreviews.length === 1 ? 'imagen' : 'imágenes'}
                        </>
                      )}
                    </Button>
                    {imagePreviews.length === 1 && (
                      <Button
                        type="button"
                        disabled={isLoading || !imageFiles[0]}
                        onClick={hasEnoughCredits ? handleGenerateClick : () => navigate('/credits')}
                        className={`bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500 text-white flex-1`}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generando...
                          </>
                        ) : !hasEnoughCredits ? (
                          <>
                          <FiImage className="w-4 h-4 mr-2" />
                          Generar (1 imagen)
                          </>
                        ) : (
                          <>
                            <FiImage className="w-4 h-4 mr-2" />
                            Generar (1 imagen)
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}
                {insufficientCredits && (
                  <div className="mt-3 text-sm text-center">
                    <p className="text-gray-600">
                      Necesitas comprar imágenes para generar una.
                    </p>
                    <Button
                      variant="link"
                      className="text-blue-500 hover:text-blue-600 p-0 mt-1"
                      onClick={() => navigate("/credits")}
                    >
                      Comprar imágenes
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