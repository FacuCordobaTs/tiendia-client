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
} from "@/components/ui/dialog";
import { Download, CreditCard, Sparkles, HelpCircle, Wand2 } from 'lucide-react'; // Importado CreditCard, Sparkles, HelpCircle y Wand2
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import AdminProductCard from '@/components/AdminProductCard';
import { Button } from '@/components/ui/button';
import EditProductForm from '@/components/EditProductForm';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router'; // Importa useNavigate para la redirección
import TutorialDialog from '@/components/TutorialDialog'; // Importar el nuevo componente
import { Textarea } from '@/components/ui/textarea'; // Importar Textarea
import toast from 'react-hot-toast';

interface Product {
  id: number;
  name: string;
  imageURL: string;
}

function App() {
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [currentAdImageUrl, setCurrentAdImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false); // Estado para el diálogo tutorial
  const [modificationPrompt, setModificationPrompt] = useState<string>(''); // Estado para el prompt de modificación
  const [isModifying, setIsModifying] = useState<boolean>(false); // Estado para indicar si se está modificando
  const [currentProductId, setCurrentProductId] = useState<number | null>(null); // Estado para guardar el ID del producto actual
  const [currentImageId, setCurrentImageId] = useState<number | null>(null); // Estado para guardar el ID de la imagen actual
  const { user, setUser } = useAuth();
  const { products, getProducts } = useProduct();
  const navigate = useNavigate(); // Hook para navegación

  const handleGenerateAd = async (id: number, includeModel: boolean) => {
    setLoading(true);
    setIsAdDialogOpen(true);
    setCurrentAdImageUrl(null); // Limpiar imagen anterior
    setModificationPrompt(''); // Limpiar prompt anterior
    setCurrentProductId(id); // Guardar el ID del producto actual
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
        const errorBody = await response.text();
        console.error("Detalles del error:", errorBody);
        throw new Error(`Error en la solicitud: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result && result.adImageUrl) {
        console.log("URL de imagen recibida:", result.adImageUrl);
        setUser(prevUser => ( 
          prevUser ? { ...prevUser, credits: prevUser.credits -50} : null
          )
        )
        setCurrentAdImageUrl(`${result.adImageUrl}`);
        setCurrentImageId(result.imageId); // Guardar el ID del producto actual
      } else {
        console.error("La respuesta de la API no contiene 'adImageUrl'. Respuesta:", result);
      }
    } catch (error) {
      console.error("Error al generar el anuncio:", error);
    } finally {
      setLoading(false);
    }
  };

  // Nueva función para manejar la modificación de la imagen
  const handleModifyImage = async () => {
    if (!currentProductId || !modificationPrompt) {
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
        setCurrentAdImageUrl(`${result.modifiedImageUrl}`);
        setCurrentImageId(result.imageId);
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

  // Función para navegar a la página de créditos
  const navigateToCredits = () => {
    navigate('/credits');
  };

  useEffect(() => {
    getProducts();
    // Comprobar si el tutorial ya se ha visto
    const tutorialSeen = localStorage.getItem('tutorialSeen');
    if (!tutorialSeen) {
      setIsTutorialOpen(true);
      localStorage.setItem('tutorialSeen', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 md:pt-6 md:pl-72 pt-16 pl-4 pr-4 flex flex-col">
      <AdminSidebar />
      {
      isDialogOpen && editingProduct &&
      <EditProductForm
          open={isDialogOpen}
          onOpenChange={(open) => {
              setIsDialogOpen(open);
          }}
          initialValues={editingProduct}
      />
      }
      {/* Renderizar el diálogo tutorial */}
      <TutorialDialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen} />

      <header className="py-8 pr-4">
        <h1 className="text-4xl font-bold pl-4">
          Tiendia.app <span role="img" aria-label="store">🏪</span>
        </h1>

        {/* Contenedor de créditos y botones */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 items-start md:items-center">
          {/* Información de créditos */}
          <div className="flex items-center bg-white shadow-sm rounded-lg px-4 py-2 border">
            <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="font-medium">
              {user?.credits != null ? user.credits.toLocaleString('es-AR') : '0'} créditos
            </span>
          </div>

          {/* Botón para cargar créditos */}
          <Button
            onClick={navigateToCredits}
            className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white shadow-md hover:shadow-lg transition-all duration-300 px-6 py-2 h-auto flex items-center gap-2"
          >
            <CreditCard className="h-5 w-5" />
            <span>Cargar Créditos</span>
          </Button>

          {/* Botón para abrir el tutorial */}
          <Button
            variant="outline"
            onClick={() => setIsTutorialOpen(true)}
            className="flex items-center gap-2 px-4 py-2 h-auto"
          >
            <HelpCircle className="h-5 w-5" />
            <span>Cómo usar la app</span>
          </Button>
        </div>
      </header>

      <main className="p-4 flex-grow">
        <p className="text-lg text-muted-foreground mb-8">
          Sube tus productos y genera imágenes profesionales en segundos ✨
        </p>
        <AddProductForm
          open={isAddProductDialogOpen}
          onOpenChange={setIsAddProductDialogOpen}
        />

        <section className="mt-8 w-full">
          <h2 className="text-2xl font-semibold my-4">
            Tus Productos
          </h2>
          {products.length === 0 ? (
             <p className="text-muted-foreground">Aún no has añadido productos.</p>
           ) : (
             <div className="grid gap-6 lg:grid-cols-3 md:grid-cols-2 justify-items-center w-full-">
               {products.map((product) => (
                  <AdminProductCard 
                  product={product} 
                  handleGenerateAd={handleGenerateAd}
                  onEdit={() => {
                    setEditingProduct(product);
                    setIsDialogOpen(true);
                  }}
                  />
               ))}
             </div>
           )}
        </section>
      </main>

      {/* Diálogo para mostrar la imagen generada */}
      <Dialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen}>
        <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh]">
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px] flex-col gap-4"> {/* Aumentar min-h para más espacio */}
              {/* Animación de carga "mágica" */}
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-75 animate-pulse"></div>
                <div className="absolute inset-4 flex items-center justify-center text-purple-300">
                  <Sparkles className="h-6 w-6 animate-ping opacity-50" />
                </div>
              </div>
              <p className="text-muted-foreground animate-pulse">Generando imagen...</p>
            </div>
          ) : isModifying ? ( // Mostrar indicador de carga para modificación
            <div className="flex items-center justify-center min-h-[300px] flex-col gap-4">
              {/* Puedes usar la misma animación o una diferente */}
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-75 animate-pulse"></div>
                <div className="absolute inset-4 flex items-center justify-center text-blue-300">
                  {/* <Wand2 className="h-6 w-6 animate-ping opacity-50" /> */}
                </div>
              </div>
              <p className="text-muted-foreground animate-pulse">Modificando imagen...</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Imagen Publicitaria <span role="img" aria-label="sparkles">✨</span></DialogTitle>
                <DialogDescription>
                  {currentAdImageUrl ? 'Esta es la imagen generada. Puedes descargarla o solicitar modificaciones.' : 'Generando imagen...'}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="mt-4 flex-1 overflow-y-auto pr-6">
                <div>
                  {currentAdImageUrl ? (
                    <img
                      src={currentAdImageUrl}
                      alt="Anuncio generado o modificado"
                      className="rounded-md w-full h-auto object-contain"
                    />
                  ) : (
                     <p className='text-center text-destructive'>No se pudo cargar la imagen.</p>
                  )}
                </div>
                <ScrollBar orientation="vertical" />
              </ScrollArea>

              {/* Sección de Modificación y Descarga */}
              {currentAdImageUrl && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Campo para instrucciones de modificación */}
                  <div className="space-y-2">
                    <label htmlFor="modification-prompt" className="text-sm font-medium">Instrucciones para modificar (opcional):</label>
                    <Textarea
                      id="modification-prompt"
                      placeholder="Ej: Haz el producto más grande..."
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
            </>
          )}
        </DialogContent>
      </Dialog>

      <footer className="container py-8 text-sm text-muted-foreground mt-auto">
        <p>✨ tiendia.app - Transformando tu negocio con IA</p>
      </footer>
    </div>
  );
}

export default App;