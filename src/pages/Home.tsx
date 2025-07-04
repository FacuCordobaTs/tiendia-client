// src/App.jsx
import AdminSidebar from '@/components/AdminSidebar';
import AddProductForm from '@/components/AddProductForm';
import { useEffect, useState } from 'react';
import { useProduct } from '@/context/ProductContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter, // Importar DialogFooter
} from "@/components/ui/dialog";
// Importar Check si es necesario (no se usa en el código final actual) o quitar si no se usa.
// import { Download, CreditCard, Sparkles, HelpCircle, Wand2, Image as ImageIcon, Check } from 'lucide-react';
import { Download, CreditCard, Sparkles, HelpCircle, Wand2, Image as ImageIcon, RefreshCw, X, Instagram, MessageCircle, Pencil } from 'lucide-react'; // Asegurarse de que ImageIcon esté importado
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminProductCard from '@/components/AdminProductCard';
import { Button } from '@/components/ui/button';
import EditProductForm from '@/components/EditProductForm';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router';
import TutorialDialog from '@/components/TutorialDialog';
import toast from 'react-hot-toast';
import { FaTiktok } from 'react-icons/fa';
// Quitar Separator si ya no se usa en el nuevo layout
// import { Separator } from '@/components/ui/separator';

interface Product {
  id: number;
  name: string;
  imageURL: string | null; // Permitir null aquí también
}

function App() {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [currentAdImageUrl, setCurrentAdImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  // const [modificationPrompt, setModificationPrompt] = useState<string>('');
  const [isModifying, setIsModifying] = useState<boolean>(false);
  // const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);
  const [currentPersonalization, setCurrentPersonalization] = useState<{
    gender?: string;
    age?: string;
    skinTone?: string;
    bodyType?: string;
  } | null>(null);
  const [isPersonalizedImage, setIsPersonalizedImage] = useState(false);
  const { user, setUser } = useAuth();
  const { products, getProducts } = useProduct();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Add new function to update generated image
  const updateGeneratedImage = (imageUrl: string) => {
    console.log('🖼️ Updating generated image URL:', imageUrl);
    setCurrentAdImageUrl(imageUrl);
    setLoading(false);
  };

  const updatePersonalizationSettings = (settings: {
    gender?: string;
    age?: string;
    skinTone?: string;
    bodyType?: string;
  } | null) => {
    setCurrentPersonalization(settings);
  };

  const setPersonalizedImageFlag = (isPersonalized: boolean) => {
    setIsPersonalizedImage(isPersonalized);
  };

  const handleGenerateAd = async (id: number, includeModel: boolean, originalUrl: string | null, isPro: boolean) => {
    console.log('🔄 Starting handleGenerateAd:', { id, includeModel, isPro });

    if (!user || (isPro ? user.credits < 100 : user.credits < 50)) {
      console.log('❌ Insufficient credits:', { 
        userCredits: user?.credits, 
        required: isPro ? 100 : 50 
      });
      toast.error('No te quedan imágenes disponibles.');
      return;
    }

    console.log('📱 Setting up UI state for generation');
    setLoading(true);
    setIsAdDialogOpen(true);
    setCurrentAdImageUrl(null);
    setOriginalImageUrl(originalUrl);
    setCurrentProductId(id);

    if (!isPro) {
      console.log('🚀 Starting standard generation process');
      try {
        console.log('📤 Sending generation request to API');
        const response = await fetch(`https://api.tiendia.app/api/products/generate-ad/${id}`, {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ includeModel })
        });

        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.error || errorBody.message || errorMessage;
            console.error('❌ API error response:', errorBody);
          } catch (e) {
            console.error("❌ Could not parse error response body:", e);
          }
          const rawError = await response.text().catch(() => "");
          console.error("❌ Raw error details:", rawError);
          toast.error(`Error al generar: ${errorMessage}`);
          throw new Error(errorMessage);
        }

        console.log('📥 Received successful response from API');
        const result = await response.json();
        console.log('📦 Processing API response:', result);

        if (result && result.adImageUrl && result.imageId) {
          console.log('✅ Generation successful, updating UI and credits');
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
          setCurrentAdImageUrl(result.adImageUrl);
          toast.success('¡Imagen generada con éxito!');
        } else {
          console.error('❌ Unexpected API response format:', result);
          toast.error('Error al obtener la imagen generada.');
        }
      } catch (error: any) {
        console.error('❌ Error in handleGenerateAd:', error);
        toast.error(error.message || 'Ocurrió un error inesperado.', { id: 'error-toast' });
      } finally {
        console.log('🏁 Finishing generation process');
        setLoading(false);
      }
    } else {
      console.log('🚀 Starting Pro generation process');
      // For Pro generation, we don't need to do anything here as the SSE connection
      // in AdminProductCard will handle the image updates
      // We just need to keep the dialog open and show the loading state
    }
  };

  // const handleModifyImage = async () => {
  //   if (!currentImageId || !modificationPrompt) {
  //     toast.error('Ingresa las instrucciones para modificar.');
  //     return;
  //   }
  //   if (!user || user.credits < 50) {
  //     toast.error('Créditos insuficientes para modificar la imagen.');
  //     return;
  //   }

  //   setIsModifying(true);
  //   try {
  //     const response = await fetch(`https://api.tiendia.app/api/products/images/modify/${currentImageId}`, {
  //       method: "POST",
  //       credentials: 'include',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ prompt: modificationPrompt }),
  //     });

  //     if (!response.ok) {
  //       let errorMessage = `Error: ${response.status} ${response.statusText}`;
  //       try {
  //         const errorBody = await response.json();
  //         errorMessage = errorBody.error || errorBody.message || errorMessage;
  //       } catch (e) {
  //         console.error("Could not parse error response body:", e);
  //       }
  //       const rawError = await response.text().catch(() => "");
  //       console.error("Detalles del error de modificación:", rawError);
  //       toast.error(`Error al modificar: ${errorMessage}`);
  //       throw new Error(errorMessage);
  //     }

  //     const result = await response.json();

  //     if (result && result.modifiedImageUrl && result.imageId) {
  //       setUser(prevUser => (
  //         prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
  //       ));
  //       setCurrentAdImageUrl(result.modifiedImageUrl);
  //       setCurrentImageId(result.imageId);
  //       toast.success('¡Imagen modificada con éxito!');
  //       setModificationPrompt('');
  //     } else {
  //       console.error("Respuesta inesperada de la API (modificación):", result);
  //       toast.error('Error al obtener la imagen modificada.');
  //     }
  //   } catch (error: any) {
  //     console.error("Error en handleModifyImage:", error);
  //     toast.error(error.message || 'Ocurrió un error al modificar.', { id: 'modify-error-toast' });
  //   } finally {
  //     setIsModifying(false);
  //   }
  // };

  const handleDownloadImage = async () => {
    if (!currentAdImageUrl) return;

    try {
      const noCacheUrl = `${currentAdImageUrl}?t=${Date.now()}`;
      console.log("Descargando imagen:", noCacheUrl);
      const response = await fetch(noCacheUrl);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const originalFileName = originalImageUrl?.split('/').pop()?.split('.')[0] || 'producto';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `tiendia_${originalFileName}_${timestamp}.png`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Imagen descargada.');
    } catch (error) {
      console.error('Error al descargar la imagen:', error);
      toast.error("No se pudo descargar la imagen.");
    }
  };

  const handleRegenerateImage = async () => {
    if (!currentProductId || !user || user.credits < 50) {
      toast.error('No te quedan imágenes disponibles.');
      navigate('/credits');
      return;
    }

    // If we know this was a personalized image, always use personalization
    if (isPersonalizedImage && currentPersonalization) {
      await regeneratePersonalizedImage();
      return;
    }

    setLoading(true);
    try {
      // If we have personalization settings, use the personalize endpoint
      if (currentPersonalization && Object.keys(currentPersonalization).length > 0) {
        const response = await fetch(`https://api.tiendia.app/api/products/personalize/${currentProductId}`, {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentPersonalization),
        });

        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.error || errorBody.message || errorMessage;
          } catch (e) {
            console.error("Could not parse error response body:", e);
          }
          toast.error(`Error al regenerar: ${errorMessage}`);
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (result && result.personalizedImageUrl) {
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
          setCurrentAdImageUrl(result.personalizedImageUrl);
          toast.success('¡Imagen regenerada con éxito!');
        } else {
          console.error("Respuesta inesperada de la API:", result);
          toast.error('Error al obtener la imagen regenerada.');
        }
      } else {
        // Use the standard generation endpoint
        const response = await fetch(`https://api.tiendia.app/api/products/generate-ad/${currentProductId}`, {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ includeModel: true })
        });

        if (!response.ok) {
          let errorMessage = `Error: ${response.status} ${response.statusText}`;
          try {
            const errorBody = await response.json();
            errorMessage = errorBody.error || errorBody.message || errorMessage;
          } catch (e) {
            console.error("Could not parse error response body:", e);
          }
          toast.error(`Error al regenerar: ${errorMessage}`);
          throw new Error(errorMessage);
        }

        const result = await response.json();

        if (result && result.adImageUrl && result.imageId) {
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
          setCurrentAdImageUrl(result.adImageUrl);
          toast.success('¡Imagen regenerada con éxito!');
        } else {
          console.error("Respuesta inesperada de la API:", result);
          toast.error('Error al obtener la imagen regenerada.');
        }
      }
    } catch (error: any) {
      console.error("Error en handleRegenerateImage:", error);
      toast.error(error.message || 'Ocurrió un error inesperado.', { id: 'regenerate-error-toast' });
    } finally {
      setLoading(false);
    }
  };

  const regeneratePersonalizedImage = async () => {
    if (!currentProductId || !user || user.credits < 50) {
      toast.error('No te quedan imágenes disponibles.');
      navigate('/credits');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`https://api.tiendia.app/api/products/personalize/${currentProductId}`, {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentPersonalization),
      });

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.error || errorBody.message || errorMessage;
        } catch (e) {
          console.error("Could not parse error response body:", e);
        }
        toast.error(`Error al regenerar: ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result && result.personalizedImageUrl) {
        setUser(prevUser => (
          prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
        ));
        setCurrentAdImageUrl(result.personalizedImageUrl);
        toast.success('¡Imagen regenerada con éxito!');
      } else {
        console.error("Respuesta inesperada de la API:", result);
        toast.error('Error al obtener la imagen regenerada.');
      }
    } catch (error: any) {
      console.error("Error en regeneratePersonalizedImage:", error);
      toast.error(error.message || 'Ocurrió un error inesperado.', { id: 'regenerate-error-toast' });
    } finally {
      setLoading(false);
    }
  };

  const navigateToCredits = () => {
    navigate('/credits');
  };

  useEffect(() => {
    getProducts();
    const tutorialSeen = localStorage.getItem('tutorialSeen');
    if (!tutorialSeen) {
      // setIsTutorialOpen(true); // Descomentar si se quiere mostrar al inicio
      localStorage.setItem('tutorialSeen', 'true');
    }
  }, []);

  const closeAdDialog = () => {
    setIsAdDialogOpen(false);
    setLoading(false);
    setIsModifying(false);
    setCurrentAdImageUrl(null);
    setOriginalImageUrl(null);
    setCurrentProductId(null);
    setCurrentPersonalization(null); // Reset personalization settings
    setIsPersonalizedImage(false); // Reset personalized image flag
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 md:pt-6 md:pl-72 pt-16 px-4 flex flex-col">
      <AdminSidebar />
      {isDialogOpen && editingProduct && (
        <EditProductForm
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialValues={editingProduct}
        />
      )}
      <TutorialDialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen} />

      <header className="py-6 md:py-8 px-2 md:px-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 pl-0 md:pl-4">
          <div className="flex items-center gap-2">
            <img src="/logoblanco.png" alt="tiendia.app logo" className="h-8 w-8" />
            <span>tiendia.app</span>
          </div>
        </h1>
        <div className="flex flex-wrap gap-3 mt-4 items-center pl-0 md:pl-4">
          <div className="flex items-center bg-white dark:bg-gray-800 shadow-sm rounded-lg px-3 py-1.5 border border-gray-200 dark:border-gray-700">
            <Sparkles className="h-4 w-4 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.credits != null ? (user.credits/50).toLocaleString('es-AR') : '0'} Imagenes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={navigateToCredits}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 px-4 py-1.5 h-auto flex items-center gap-2 text-sm rounded-lg"
            >
              <CreditCard className="h-4 w-4" />
              <span>Comprar imágenes</span>
            </Button>
            <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-yellow-500" />
                Ahorra hasta 15%
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-green-500" />
                Pago seguro
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Wand2 className="h-3 w-3 text-purple-500" />
                Mejores resultados
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 h-auto text-sm rounded-lg border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <HelpCircle className="h-4 w-4" />
            <span>Ayuda</span>
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/30"
              onClick={() => window.open('https://instagram.com/tiendia.app', '_blank')}
            >
              <Instagram className="h-5 w-5 text-pink-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-black/10 dark:hover:bg-white/10"
              onClick={() => window.open('https://tiktok.com/@tiendia.app', '_blank')}
            >
              <FaTiktok className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-green-100 dark:hover:bg-green-900/30"
              onClick={() => window.open('https://wa.me/543408681915', '_blank')}
            >
              <MessageCircle className="h-5 w-5 text-green-500" />
            </Button>
          </div>
        </div>
      </header>

      <main className="p-2 md:p-4 flex-grow">
        <div className="mb-6 pl-0 md:pl-4">
          <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl p-4 md:p-6 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-2">
                  <Sparkles className="h-5 w-5" />
                  ¡Mejora tus fotos de productos!
                </h2>
                <p className="text-white/90 text-sm md:text-base">
                  Te ayudamos a tener fotos más lindas para tu tienda, desde $80 por imagen
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                  <CreditCard className="h-5 w-5 text-white" />
                  <div className="text-white">
                    <p className="text-xs font-medium">Ahorra hasta</p>
                    <p className="text-lg font-bold">15%</p>
                  </div>
                </div>
                <Button
                  onClick={navigateToCredits}
                  className="bg-white text-purple-600 hover:bg-white/90 px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Comprar imágenes
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-base text-gray-600 dark:text-gray-400 mb-6 pl-0 md:pl-4">
          Sube tus productos y genera imágenes profesionales en segundos ✨
        </p>
        <AddProductForm
          open={isAddProductDialogOpen}
          onOpenChange={setIsAddProductDialogOpen}
        />
        <section className="mt-6 w-full pl-0 md:pl-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Tus Productos
          </h2>
          {products.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-200">No hay productos</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Empieza subiendo tu primer producto.</p>
              <div className="mt-6">
                <Button onClick={() => setIsAddProductDialogOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" /> Añadir Producto
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <AdminProductCard
                  key={product.id}
                  product={product}
                  handleGenerateAd={handleGenerateAd}
                  onEdit={() => {
                    setEditingProduct(product);
                    setIsDialogOpen(true);
                  }}
                  updateGeneratedImage={updateGeneratedImage}
                  updatePersonalizationSettings={updatePersonalizationSettings}
                  setPersonalizedImageFlag={setPersonalizedImageFlag}
                  setIsAdDialogOpen={setIsAdDialogOpen}
                  setCurrentAdImageUrl={setCurrentAdImageUrl}
                  setOriginalImageUrl={setOriginalImageUrl}
                  setCurrentProductId={setCurrentProductId}
                  setLoading={setLoading}
                />
              ))}
            </div>
          )}
        </section>
      </main>
      <Dialog open={isAdDialogOpen} onOpenChange={closeAdDialog}>
        {/* AJUSTE DE TAMAÑO: Ancho relativo en móvil, max-w en desktop */}
        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-0 overflow-hidden">

          {/* Indicador de Carga General */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[350px] sm:min-h-[400px] flex-col gap-4 p-6">
              <div className="relative h-16 w-16 sm:h-20 sm:w-20">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-50 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center text-purple-300">
                  <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 animate-bounce opacity-75" />
                </div>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground animate-pulse mt-4">Generando imagen...</p>
            </div>
          ) : (
            <>
              {/* Encabezado del Diálogo */}
              <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center">
                  <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-500" />
                  Imagen Generada
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Compara el antes y el después.
                </DialogDescription>
              </DialogHeader>

              {/* Área Principal con Scroll */}
              <ScrollArea className="flex-1 overflow-y-auto p-4 sm:p-6">
                {isFullscreen ? (
                  // Fullscreen Image View
                  <div className="relative w-full h-full min-h-[350px] sm:min-h-[400px] flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsFullscreen(false)}
                      className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {currentAdImageUrl ? (
                      <img
                        src={currentAdImageUrl}
                        alt="Anuncio generado o modificado"
                        className="max-w-full max-h-[400px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="w-8 h-8 sm:w-10 sm:w-10" />
                      </div>
                    )}
                  </div>
                ) : (
                  // Comparison View
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 ">
                    {/* Columna "Antes" */}
                    <div className="w-full">
                      <h3 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Antes</h3>
                      <div className="aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        {originalImageUrl ? (
                          <img
                            src={originalImageUrl}
                            alt="Imagen original"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <ImageIcon className="w-8 h-8 sm:w-10 sm:w-10" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Columna "Después" */}
                    <div className="w-full relative">
                      <h3 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Después ✨</h3>
                      {isModifying && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg sm:rounded-xl z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative h-8 w-8 sm:h-10 sm:h-10">
                              <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-blue-400 animate-spin"></div>
                            </div>
                            <p className="text-xs text-blue-600 dark:text-blue-300 animate-pulse">Modificando...</p>
                          </div>
                        </div>
                      )}
                      <div 
                        className={`aspect-w-1 aspect-h-1 bg-gray-100 dark:bg-gray-800 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm transition-opacity duration-300 ${isModifying ? 'opacity-50' : 'opacity-100'} cursor-pointer hover:opacity-90`}
                        onClick={() => currentAdImageUrl && setIsFullscreen(true)}
                      >
                        {currentAdImageUrl ? (
                          <img
                            src={currentAdImageUrl}
                            alt="Anuncio generado o modificado"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-1 sm:gap-2 px-2 sm:px-4 text-center">
                            <ImageIcon className="w-8 h-8 sm:w-10 sm:w-10" />
                            {!loading && <span className="text-xs text-red-500">No se pudo generar.</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sección de Modificación */}
               
              </ScrollArea>

              {/* Footer del Diálogo con Botones Principales */}
              {/* AJUSTE: flex-col sm:flex-row y order para apilar en móvil */}
              <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-2 sm:order-1">
                  
                  {currentAdImageUrl && (
                    <div className="flex flex-col gap-2">
                      {currentPersonalization && Object.keys(currentPersonalization).length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md">
                          <Pencil className="w-3 h-3" />
                          <span>Personalización activa</span>
                        </div>
                      )}
                      <Button
                        onClick={handleRegenerateImage}
                        disabled={loading || isModifying}
                        className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <RefreshCw className="mr-1 h-4 w-4" />
                        Regenerar
                      </Button>
                    </div>
                  )}
                </div>
                {currentAdImageUrl && (
                  <Button
                    onClick={handleDownloadImage}
                    disabled={isModifying || loading}
                    className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all hover:shadow-md"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Descargar Resultado
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <footer className="py-4 px-4 text-center text-xs text-gray-500 dark:text-gray-400 mt-auto">
        <p>✨ tiendia.app - Transformando tu negocio con IA</p>
      </footer>
    </div>
  );
}

export default App;