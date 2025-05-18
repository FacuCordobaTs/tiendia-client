import { useState, useRef, useEffect } from 'react';
import { useProduct } from '@/context/ProductContext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, AlertCircle, Wand2, Download, Camera, Image as ImageIcon, X } from 'lucide-react';
import { FaCloudUploadAlt } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FiImage } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [activeTab, setActiveTab] = useState<string>("gallery");
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      // Cleanup camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

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
        setImageFile(file);
        
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => {
          if (reader.result) {
            const dataUrl = reader.result as string;
            setOriginalImageUrl(dataUrl);
            setImagePreview(dataUrl);
            
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

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    if (tab === "camera") {
      startCamera();
    } else if (isCameraActive) {
      stopCamera();
    }
  };

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
    setActiveTab("gallery");
    if (isCameraActive) stopCamera();
  };

  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetForm();
      }
      onOpenChange(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-full px-6 py-2">
          <PlusCircle className="h-5 w-5 mr-2" />
          Agregar Producto con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl p-0 overflow-hidden border border-white/20">
        {currentAdImageUrl && generatedProductName ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 backdrop-blur-sm">
              <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                <Wand2 className="w-6 h-6 mr-3 text-purple-500" />
                Producto Generado
              </DialogTitle>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Compara el antes y el después
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1 overflow-y-auto p-6">
              <div className="grid gap-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{generatedProductName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                    <h4 className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Antes</h4>
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-white/20">
                      <img
                        src={originalImageUrl || ''}
                        alt="Imagen Original"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                    <h4 className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Después ✨</h4>
                    {isModifying && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                          <p className="text-sm text-blue-600 dark:text-blue-300">Modificando...</p>
                        </div>
                      </div>
                    )}
                    <div className="aspect-w-1 aspect-h-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg overflow-hidden border border-white/20">
                      <img
                        src={currentAdImageUrl}
                        alt="Imagen Generada"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="modification-prompt" className="text-sm font-medium">Instrucciones para modificar (opcional):</Label>
                    <Textarea
                      id="modification-prompt"
                      placeholder="Ej: Cambia el fondo a una playa..."
                      value={modificationPrompt}
                      onChange={(e) => setModificationPrompt(e.target.value)}
                      className="min-h-[80px] bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 focus:border-blue-400 transition-colors"
                      disabled={isModifying}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Costo: 50 créditos por modificación.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Button
                      onClick={handleModifyImage}
                      disabled={!modificationPrompt || isModifying}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-6 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Modificar Imagen
                    </Button>
                    <Button
                      onClick={handleDownloadImage}
                      variant="outline"
                      disabled={isModifying}
                      className="w-full sm:w-auto border-white/20 hover:border-blue-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-2 transition-all duration-300"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="px-6 py-4 border-t border-white/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                className="w-full sm:w-auto border-white/20 hover:border-blue-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-2 transition-all duration-300"
              >
                Cerrar
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 backdrop-blur-sm">
              <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Generar Producto con IA</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <Tabs value={activeTab} onValueChange={switchTab} className="h-full">
                <div className="w-full flex justify-center pt-4 pb-2">
                  <div className="w-full max-w-md">
                    <TabsList className="grid grid-cols-2 w-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full p-1 border border-white/20">
                      <TabsTrigger value="gallery" className="flex items-center gap-2 py-3 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg transition-all duration-300">
                        <ImageIcon className="h-4 w-4" />
                        <span>Galería</span>
                      </TabsTrigger>
                      <TabsTrigger value="camera" className="flex items-center gap-2 py-3 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:shadow-lg transition-all duration-300">
                        <Camera className="h-4 w-4" />
                        <span>Cámara</span>
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </div>
                
                <TabsContent value="gallery" className="h-full">
                  <ScrollArea className="h-full max-h-[60vh] p-6">
                    <div className="grid gap-6">
                      {insufficientCredits && (
                        <Alert variant="destructive" className="mb-2 bg-red-500/10 backdrop-blur-sm border-red-500/20">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <AlertDescription>
                            No tienes suficientes créditos. Se requieren {REQUIRED_CREDITS} créditos.
                          </AlertDescription>
                        </Alert>
                      )}
                      <div className="space-y-3">
                        <Label htmlFor="image-upload" className="text-sm font-medium">Selecciona una imagen de tu galería</Label>
                        <div
                          className={`mt-1 flex flex-col items-center justify-center px-6 pt-8 pb-8 border-2 ${
                            isCompressing 
                              ? 'border-yellow-300/50 bg-yellow-500/5' 
                              : imagePreview 
                                ? 'border-blue-300/50 bg-blue-500/5' 
                                : 'border-white/20 bg-white/5'
                          } rounded-2xl hover:border-blue-400/50 hover:bg-blue-500/5 cursor-pointer transition-all duration-300 backdrop-blur-sm min-h-[320px] relative shadow-lg`}
                          onClick={() => !isCompressing && document.getElementById('image-upload')?.click()}
                          style={{ maxWidth: 340 }}
                        >
                          {isCompressing ? (
                            <div className="flex flex-col items-center justify-center py-4">
                              <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mb-2" />
                              <p className="text-sm text-gray-600 dark:text-gray-300">Comprimiendo imagen...</p>
                            </div>
                          ) : imagePreview ? (
                            <>
                              <div className="flex flex-col items-center w-full">
                                <div className="relative group w-full flex justify-center">
                                  <img 
                                    src={imagePreview} 
                                    alt="Previsualización" 
                                    className="max-h-48 w-auto object-contain rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105" 
                                    style={{ maxWidth: 220 }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-colors duration-300" />
                                </div>
                                {fileSize > 0 && (
                                  <span className="text-xs mt-3 text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full backdrop-blur-sm">
                                    {formatFileSize(fileSize)} {fileSize > MAX_FILE_SIZE ? '(Comprimida)' : ''}
                                  </span>
                                )}
                              </div>
                              {/* Action buttons always visible below preview */}
                              <div className="flex flex-col sm:flex-row gap-3 pt-5 w-full">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={isLoading}
                                  onClick={e => {
                                    e.stopPropagation();
                                    setImageFile(null);
                                    setImagePreview(null);
                                    setOriginalImageUrl(null);
                                  }}
                                  className="flex-1 border-white/20 hover:border-red-400 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-2 transition-all duration-300"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar
                                </Button>
                                <Button
                                  type="button"
                                  disabled={isLoading || !imageFile || !hasEnoughCredits}
                                  onClick={handleGenerateClick}
                                  className={`flex-1 rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300 ${
                                    hasEnoughCredits 
                                      ? "bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white" 
                                      : "bg-gray-400"
                                  }`}
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
                            </>
                          ) : (
                            <div className="space-y-3 text-center w-full">
                              <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-full inline-block backdrop-blur-sm">
                                <FaCloudUploadAlt className="h-12 w-12 text-blue-500" />
                              </div>
                              <div className="flex text-sm text-gray-600 dark:text-gray-300 justify-center">
                                <span className="relative bg-white/50 dark:bg-gray-800/50 rounded-full px-4 py-2 font-medium text-blue-600 hover:text-blue-500 backdrop-blur-sm transition-all duration-300">
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
                    </div>
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="camera" className="h-full">
                  <div className="flex flex-col h-full">
                    <div className="relative flex-grow flex justify-center items-center bg-black/90 p-4">
                      {cameraPermissionDenied ? (
                        <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md">
                          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                          <p className="text-white text-xl mb-4">Acceso a la cámara denegado</p>
                          <p className="text-gray-300 text-sm mb-6">Para usar esta función, por favor permite el acceso a la cámara en la configuración de tu navegador.</p>
                          <Button 
                            onClick={() => {
                              setCameraPermissionDenied(false);
                              startCamera();
                            }}
                            className="bg-white text-black hover:bg-gray-100 rounded-full px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300"
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
                            className="h-full w-full object-cover rounded-2xl shadow-2xl"
                            style={{ display: isCameraActive ? 'block' : 'none' }}
                          />
                          
                          <canvas 
                            ref={canvasRef} 
                            className="hidden"
                          />
                          
                          {isCameraActive && (
                            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                              <Button
                                onClick={captureImage}
                                disabled={isCapturing}
                                className="rounded-full w-20 h-20 p-0 border-4 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 shadow-xl hover:shadow-2xl"
                              >
                                {isCapturing ? (
                                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                                ) : (
                                  <div className="rounded-full w-14 h-14 bg-white shadow-lg"></div>
                                )}
                              </Button>
                            </div>
                          )}
                          
                          {!isCameraActive && !isLoading && (
                            <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 max-w-md">
                              <div className="bg-white/20 p-4 rounded-full inline-block mb-6">
                                <Camera className="h-16 w-16 text-white" />
                              </div>
                              <p className="text-white text-xl mb-8">Activa la cámara para tomar una foto</p>
                              <Button 
                                onClick={startCamera}
                                className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                              >
                                <Camera className="h-5 w-5 mr-2" />
                                Activar Cámara
                              </Button>
                            </div>
                          )}
                          
                          {isLoading && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-2xl">
                              <Loader2 className="h-16 w-16 animate-spin text-blue-400 mb-4" />
                              <p className="text-xl text-white font-medium">Generando imagen...</p>
                              <p className="text-sm text-gray-300 mt-2">Esto puede tomar unos momentos</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    
                    <div className="p-6 text-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-white/10">
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        La foto se procesará automáticamente después de tomarla
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Costo: {REQUIRED_CREDITS} créditos
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              {insufficientCredits && (
                <div className="mt-3 text-sm text-center p-6 border-t border-white/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    Necesitas {REQUIRED_CREDITS} créditos para generar una imagen.
                  </p>
                  <Button
                    variant="link"
                    className="text-blue-500 hover:text-blue-600 p-0 mt-2"
                    onClick={() => navigate("/credits")}
                  >
                    Recargar créditos
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddProductForm;