import AdminSidebar from '@/components/AdminSidebar';
import AddProductForm from '@/components/AddProductForm';
import { useEffect, useState } from 'react';
import { useProduct } from '@/context/ProductContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Download, CreditCard, Sparkles, Wand2, Image as ImageIcon, RefreshCw, X, MessageCircle, Pencil } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import AdminProductCard from '@/components/AdminProductCard';
import { Button } from '@/components/ui/button';
import EditProductForm from '@/components/EditProductForm';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router';
import TutorialDialog from '@/components/TutorialDialog';
import toast from 'react-hot-toast';
import { FaTiktok } from 'react-icons/fa';
import Loader from '@/components/Loader';
import { Progress } from "@/components/ui/progress"

interface Product {
  id: number;
  name: string;
  imageURL: string | null;
}

function App() {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [currentAdImageUrl, setCurrentAdImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isModifying, setIsModifying] = useState<boolean>(false);
  const [currentProductId, setCurrentProductId] = useState<number | null>(null);
  
  // --- NUEVOS ESTADOS SIMPLIFICADOS ---
  // Tipos: 'model' | 'remove-background' | 'universal'
  const [generationType, setGenerationType] = useState<string>('model');
  const [currentPersonalization, setCurrentPersonalization] = useState<any>(null);

  const { user, setUser } = useAuth();
  const { products, getProducts } = useProduct();
  const navigate = useNavigate();
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const maintenance = false;

  // Función unificada para actualizar la imagen generada y el tipo de generación
  const updateGeneratedImage = (imageUrl: string, type: string = 'model', params: any = null) => {
    console.log('🖼️ Updating generated image:', imageUrl, 'Type:', type);
    setCurrentAdImageUrl(imageUrl);
    setGenerationType(type);
    if (params) {
      setCurrentPersonalization(params);
    }
    setLoading(false);
  };

  const updatePersonalizationSettings = (settings: any) => {
    setCurrentPersonalization(settings);
  };

  const handleGenerateAd = async (id: number, includeModel: boolean, originalUrl: string | null, isPro: boolean) => {
    console.log('🔄 Starting handleGenerateAd:', { id, includeModel, isPro });

    if (!user || (isPro ? user.credits < 100 : user.credits < 50)) {
      toast.error('No te quedan imágenes disponibles.');
      return;
    }

    setLoading(true);
    setIsAdDialogOpen(true);
    setCurrentAdImageUrl(null);
    setOriginalImageUrl(originalUrl);
    setCurrentProductId(id);

    // Default a modelo standard
    setGenerationType('model');

    if (!isPro) {
      try {
        const response = await fetch(`https://api.tiendia.app/api/products/generate-ad/${id}`, {
          method: "POST",
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ includeModel })
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || errorBody.message || response.statusText);
        }

        const result = await response.json();

        if (result && result.adImageUrl) {
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
          setCurrentAdImageUrl(result.adImageUrl);
          toast.success('¡Imagen generada con éxito!');
        } else {
          toast.error('Error al obtener la imagen generada.');
        }
      } catch (error: any) {
        console.error('❌ Error in handleGenerateAd:', error);
        toast.error('Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadImage = async () => {
    if (!currentAdImageUrl) return;
    try {
      const noCacheUrl = `${currentAdImageUrl}?t=${Date.now()}`;
      const response = await fetch(noCacheUrl);
      if (!response.ok) throw new Error('Network response not ok');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const originalFileName = originalImageUrl?.split('/').pop()?.split('.')[0] || 'producto';
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `tiendia_${originalFileName}_${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Imagen descargada.');
    } catch (error) {
      console.error('Error:', error);
      toast.error("No se pudo descargar la imagen.");
    }
  };

  // --- LÓGICA DE REGENERACIÓN SIMPLIFICADA ---
  const handleRegenerateImage = async () => {
    if (!currentProductId || !user || user.credits < 50) {
      toast.error('No te quedan imágenes disponibles.');
      if (user && user.credits < 50) navigate('/credits');
      return;
    }

    setLoading(true);

    try {
      let endpoint = '';
      let body: any = {};
      
      // Selección de endpoint basado en el tipo de la última generación
      if (generationType === 'model') {
        endpoint = `https://api.tiendia.app/api/products/generate-ad/${currentProductId}`;
        body = { includeModel: true };
      } else if (generationType === 'remove-background') {
        endpoint = `https://api.tiendia.app/api/products/remove-background-image/${currentProductId}`;
        body = {};
      } else if (generationType === 'universal') {
        endpoint = `https://api.tiendia.app/api/products/universal-image/${currentProductId}`;
        body = currentPersonalization || {}; // Usar los parámetros guardados
      }

      const response = await fetch(endpoint, {
        method: "POST",
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || errorBody.message || response.statusText);
      }

      const result = await response.json();
      
      // Mapeo de respuesta según el tipo (cada endpoint devuelve una propiedad distinta para la URL)
      let imageUrl = null;
      if (generationType === 'model') imageUrl = result.adImageUrl;
      else if (generationType === 'remove-background') imageUrl = result.removeBackgroundImageUrl;
      else if (generationType === 'universal') imageUrl = result.imageUrl;

      if (imageUrl) {
        setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
        setCurrentAdImageUrl(imageUrl);
        toast.success('¡Imagen regenerada con éxito!');
      } else {
        toast.error('Error al obtener la imagen regenerada.');
      }

    } catch (error: any) {
      console.error("Error en handleRegenerateImage:", error);
      toast.error('Ocurrió un error inesperado al regenerar.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToCredits = () => {
    navigate('/credits');
  };
  
  useEffect(() => {
    if (!loading) {
      setProgressValue(0);
      return;
    }
    const duration = 7000;
    const startTime = performance.now();
    let animationFrame: number;
    let isCancelled = false;
    const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animate = (now: number) => {
      if (isCancelled) return;
      const elapsed = now - startTime;
      const normalizedProgress = Math.min(elapsed / duration, 1);
      setProgressValue(Math.round(easeInOutCubic(normalizedProgress) * 100));
      if (normalizedProgress < 1) animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);
    return () => { isCancelled = true; if (animationFrame) cancelAnimationFrame(animationFrame); };
  }, [loading]);

  useEffect(() => {
    getProducts();
    const tutorialSeen = localStorage.getItem('tutorialSeen');
    if (!tutorialSeen) localStorage.setItem('tutorialSeen', 'true');
  }, []);

  const closeAdDialog = () => {
    setIsAdDialogOpen(false);
    setLoading(false);
    setIsModifying(false);
    setCurrentAdImageUrl(null);
    setOriginalImageUrl(null);
    setCurrentProductId(null);
    // No reseteamos currentPersonalization ni generationType aquí para permitir regenerar inmediatamente si se reabre por alguna razón, o simplemente se limpia al iniciar nueva generación.
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 md:pt-6 md:pl-72 pt-16 px-4 flex flex-col">
      <Dialog open={maintenance}>
        <DialogContent className="max-w-md text-center flex flex-col items-center justify-center">
          <DialogTitle className="text-2xl font-bold mb-2">Sitio en mantenimiento</DialogTitle>
          <p className="text-base text-gray-700 dark:text-gray-200 mb-4">La generación de imágenes está temporalmente deshabilitada.<br/>Estamos trabajando para restablecer el servicio.<br/></p>
        </DialogContent>
      </Dialog>
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
          <div className="flex flex-col items-center gap-2">
            <img src="/logotransparente.png" alt="tiendia.app logo" className="h-32 w-32" />
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
          
          <div className="flex gap-2">
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
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 pl-0 md:pl-4">
          {user?.email}
        </p>
      </header>
      
      <main className="p-2 md:p-4 flex-grow">
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
        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center min-h-[350px] sm:min-h-[400px] flex-col gap-4 p-6">
              <Loader />
              <Progress value={progressValue}  className="w-full max-w-xs sm:max-w-sm [&>*]:bg-blue-500" />
              <p className="text-base sm:text-lg text-muted-foreground animate-pulse mt-4">Generando imagen...</p>
            </div>
          ) : (
            <>
              <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-50 flex items-center justify-between">
                  <div className="flex items-center">
                    <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-500" />
                    Imagen Generada
                  </div>
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Compara el antes y el después.
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-1 overflow-y-auto p-4 sm:p-6">
                {isFullscreen ? (
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
                        alt="Anuncio generado"
                        className="max-w-full max-h-[400px] object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <ImageIcon className="w-8 h-8 sm:w-10" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 ">
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
                            <ImageIcon className="w-8 h-8 sm:w-10" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full relative">
                      <h3 className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Después ✨</h3>
                      {isModifying && (
                        <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm flex items-center justify-center rounded-lg sm:rounded-xl z-10">
                          <div className="flex flex-col items-center gap-2">
                            <div className="relative h-8 w-8 sm:h-10">
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
                            alt="Anuncio generado"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400 flex-col gap-1 sm:gap-2 px-2 sm:px-4 text-center">
                            <ImageIcon className="w-8 h-8 sm:w-10" />
                            {!loading && <span className="text-xs text-red-500">No se pudo generar.</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>

              <DialogFooter className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto order-2 sm:order-1">
                  
                  {currentAdImageUrl && (
                    <div className="flex flex-col gap-2">
                      {generationType === 'universal' && (
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