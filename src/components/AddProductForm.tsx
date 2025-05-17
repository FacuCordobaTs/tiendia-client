import { useState, useRef, useEffect, useCallback } from 'react';
import { useProduct } from '@/context/ProductContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, AlertCircle, Wand2, Download, Camera, Upload, ArrowLeft, Check } from 'lucide-react';
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

const MAX_FILE_SIZE = (3 * 1024 * 1024);
const REQUIRED_CREDITS = 50;

type InputMode = 'camera' | 'gallery' | null;

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
  const [inputMode, setInputMode] = useState<InputMode>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(false);
  const [captureAndGenerate, setCaptureAndGenerate] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));

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

  const startCamera = useCallback(async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      setIsCameraLoading(true);
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setCameraError("No se pudo acceder a la cámara. Verifica los permisos.");
        toast.error("Error al acceder a la cámara.");
      } finally {
        setIsCameraLoading(false);
      }
    } else {
      setCameraError("La cámara no es soportada por este navegador.");
      toast.error("Cámara no soportada.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (inputMode === 'camera' && open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [inputMode, open, startCamera, stopCamera]);

  const handleCaptureImageAndProceed = async () => {
    if (videoRef.current && canvasRef.current) {
      setIsLoading(true); // Show loading indicator immediately
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL('image/jpeg');
      setOriginalImageUrl(imageBase64); // For "Antes" preview
      setImagePreview(imageBase64); // For immediate feedback if needed

      canvas.toBlob(async (blob) => {
        if (blob) {
          let capturedFile = new File([blob], `captured_image_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFileSize(capturedFile.size);

          if (capturedFile.size > MAX_FILE_SIZE) {
            try {
              setIsCompressing(true);
              capturedFile = await compressImage(capturedFile);
              setFileSize(capturedFile.size);
              const readerCompressed = new FileReader();
              readerCompressed.readAsDataURL(capturedFile);
              readerCompressed.onload = () => {
                if (readerCompressed.result) {
                  setOriginalImageUrl(readerCompressed.result as string);
                  setImagePreview(readerCompressed.result as string);
                }
                setIsCompressing(false);
              };
            } catch (error) {
              console.error("Error compressing captured image:", error);
              toast.error("Error al comprimir la imagen capturada.");
              setIsCompressing(false);
              setIsLoading(false);
              return;
            }
          }
          setImageFile(capturedFile);
          stopCamera();
          setInputMode(null);
          setCaptureAndGenerate(true); // Set flag to trigger generation
        } else {
          toast.error("No se pudo capturar la imagen.");
          setIsLoading(false);
        }
      }, 'image/jpeg');
    }
  };

  useEffect(() => {
    if (captureAndGenerate && imageFile && !isLoading) {
      // Ensure isLoading is false before starting a new generation process
      // This check prevents re-triggering if isLoading was true from handleCaptureImageAndProceed
      handleGenerateClick();
      setCaptureAndGenerate(false); // Reset flag
    }
  }, [captureAndGenerate, imageFile, isLoading]); // Removed handleGenerateClick from dependencies

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

  const handleGenerateClick = useCallback(async (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    if (user && user?.credits < REQUIRED_CREDITS) {
      setInsufficientCredits(true);
      toast.error("Créditos insuficientes.");
      setIsLoading(false); // Ensure loading is stopped
      return;
    }
    if (!imageFile) {
      console.error("No image selected.");
      toast.error("Ninguna imagen seleccionada.");
      setIsLoading(false); // Ensure loading is stopped
      return;
    }
    setIsLoading(true);
    try {
      const imageBase64 = await toBase64(imageFile);
      const result = await generateProductAndImage(imageBase64, includeModel);
      setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
      setCurrentAdImageUrl(result.generatedImageUrl);
      setGeneratedProductName(result.name);
      setIncludeModel(false);
      setFileSize(0); // Reset fileSize after generation
      setInsufficientCredits(false);
      setCurrentImageId(result.imageId);
      setImageFile(null); // Clear the image file after successful generation
      setImagePreview(null); // Clear preview
    } catch (error) {
      console.error("Error generating product and image:", error);
      toast.error("Error al generar el producto.");
    } finally {
      setIsLoading(false);
    }
  }, [imageFile, user, includeModel, generateProductAndImage, setUser]);

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
      setGeneratedProductName(null);
      setFileSize(0);
      setInsufficientCredits(false);
      setModificationPrompt('');
      setCurrentImageId(null);
      setInputMode(null);
      stopCamera();
      setCameraError(null);
      setIsCameraLoading(false);
      setCaptureAndGenerate(false);
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
    setInputMode(null);
    stopCamera();
    setCameraError(null);
    setIsCameraLoading(false);
    setCaptureAndGenerate(false);
  };

  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;

  const renderInitialSelection = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8">
      <DialogHeader className="mb-8 text-center">
        <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-50">
          Agregar Producto con IA
        </DialogTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Elige cómo quieres subir la imagen de tu producto.
        </p>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-md">
        <Button
          onClick={() => { setInputMode('camera'); }}
          className="h-auto py-6 sm:py-8 text-base sm:text-lg bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 flex flex-col items-center justify-center"
        >
          <Camera className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-white" />
          Tomar Foto
        </Button>
        <Button
          onClick={() => setInputMode('gallery')}
          className="h-auto py-6 sm:py-8 text-base sm:text-lg bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 flex flex-col items-center justify-center"
        >
          <Upload className="w-10 h-10 sm:w-12 sm:h-12 mb-3 text-white" />
          Desde Galería
        </Button>
      </div>
    </div>
  );

  const renderCameraView = () => (
    <div className="flex flex-col h-full">
      <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => { setInputMode(null); stopCamera(); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50">Tomar Foto del Producto</DialogTitle>
        <div className="w-8"> {/* Spacer */}</div>
      </DialogHeader>
      <div className="flex-1 flex flex-col items-center justify-center p-2 bg-black relative">
        {isCameraLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-20">
            <Loader2 className="h-12 w-12 animate-spin text-white mb-3" />
            <p className="text-white text-lg">Iniciando cámara...</p>
          </div>
        )}
        {cameraError && !isCameraLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 text-center p-4 z-20">
            <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
            <p className="text-white text-lg mb-2">Error de Cámara</p>
            <p className="text-red-300 text-sm mb-4">{cameraError}</p>
            <Button onClick={startCamera} variant="outline" className="text-white border-white hover:bg-white hover:text-black">
              Intentar de Nuevo
            </Button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-contain transition-opacity duration-300 ${isCameraLoading || cameraError ? 'opacity-0' : 'opacity-100'}`}
          onLoadedData={() => setIsCameraLoading(false)} // Hide loader once video data is loaded
        />
        {isLoading && !currentAdImageUrl && ( // Show this loader only during capture->generation phase
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-75 z-30">
                <Loader2 className="h-12 w-12 animate-spin text-purple-400 mb-3" />
                <p className="text-white text-lg">Procesando y generando...</p>
            </div>
        )}
      </div>
      <div className="bg-black p-4 flex items-center justify-center border-t border-gray-700">
        <Button
          onClick={handleCaptureImageAndProceed}
          disabled={isCameraLoading || !!cameraError || isLoading || !cameraStream}
          className="p-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white hover:bg-gray-200 focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-opacity-50 transition-all duration-200 ease-in-out flex items-center justify-center"
          aria-label="Tomar Foto"
        >
          <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full bg-white ring-2 ring-inset ring-black flex items-center justify-center">
             <Check className="h-8 w-8 sm:h-10 sm:h-10 text-black" />
          </div>
        </Button>
      </div>
    </div>
  );

  const renderGalleryUploadView = () => (
    <div className="flex flex-col h-full">
      <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
         <Button variant="ghost" size="icon" onClick={() => setInputMode(null)} className="mr-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <DialogTitle className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-50">Subir desde Galería</DialogTitle>
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
            <div
              className={`mt-1 flex justify-center px-4 pt-4 pb-4 border-2 ${isCompressing ? 'border-yellow-300 dark:border-yellow-600' : imagePreview ? 'border-blue-300 dark:border-blue-500' : 'border-gray-300 dark:border-gray-600 border-dashed'} rounded-md hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-colors`}
              onClick={() => !isCompressing && document.getElementById('image-upload')?.click()}
            >
              {isCompressing ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-300">Comprimiendo imagen...</p>
                </div>
              ) : imagePreview ? (
                <div className="flex flex-col items-center">
                  <img src={imagePreview} alt="Previsualización" className="max-h-40 w-auto object-contain rounded" />
                  {fileSize > 0 && (
                    <span className="text-xs mt-2 text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileSize)} {fileSize > MAX_FILE_SIZE ? '(Comprimida)' : ''}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-center py-4">
                  <FaCloudUploadAlt className="mx-auto h-10 w-10 text-gray-400 dark:text-gray-500" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-300">
                    <span className="relative bg-white dark:bg-gray-900 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP hasta 3MB</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">(Imágenes grandes se comprimirán)</p>
                </div>
              )}
            </div>
          </div>
          {imagePreview && !isCompressing && (
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  // onOpenChange(false); // Keep dialog open, just reset form parts related to gallery
                  setImageFile(null);
                  setImagePreview(null);
                  setOriginalImageUrl(null);
                  setFileSize(0);
                }}
                className="flex-1 border-gray-300 dark:border-gray-600"
              >
                Borrar Selección
              </Button>
              <Button
                type="button"
                disabled={isLoading || !imageFile || !hasEnoughCredits}
                onClick={handleGenerateClick}
                className={`${hasEnoughCredits ? "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500" : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"} transition-all duration-300 text-white flex-1`}
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
              <p className="text-gray-600 dark:text-gray-300">
                Necesitas {REQUIRED_CREDITS} créditos para generar una imagen.
              </p>
              <Button
                variant="link"
                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 p-0 mt-1"
                onClick={() => {
                  onOpenChange(false); // Close current dialog
                  navigate("/credits");
                }}
              >
                Recargar créditos
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );

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
            {!inputMode && !isLoading && renderInitialSelection()}
            {inputMode === 'camera' && !isLoading && renderCameraView()}
            {inputMode === 'gallery' && !isLoading && renderGalleryUploadView()}
            {isLoading && !currentAdImageUrl && inputMode !== 'camera' && ( // General loader for gallery, not for camera capture phase
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-900/80 z-30">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        {isCompressing ? "Comprimiendo y preparando..." : "Generando tu producto..."}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Esto puede tardar un momento.</p>
                </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddProductForm;