import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Download, AlertCircle, Image as ImageIcon, Loader2, Trash2, Wand2 } from 'lucide-react'; // Added Wand2, Sparkles
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,        // Added
    DialogTitle,         // Added
    DialogDescription,   // Added
} from "@/components/ui/dialog";
import { useAuth } from '@/context/AuthContext';
import { Textarea } from '@/components/ui/textarea'; // Added
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Added
import toast from 'react-hot-toast'; // Added

interface GeneratedImage {
    imageId: number;
    imageUrl: string;
    productId: number;
    productName?: string;
    createdAt?: string;
}

function GeneratedImagesPage() {
    const { user, setUser } = useAuth(); // Added setUser
    const [images, setImages] = useState<GeneratedImage[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [isImageViewOpen, setIsImageViewOpen] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const [isModifyDialogOpen, setIsModifyDialogOpen] = useState(false); // Added
    const [currentModifyImageId, setCurrentModifyImageId] = useState<number | null>(null); // Added
    const [currentModifyImageUrl, setCurrentModifyImageUrl] = useState<string | null>(null); // Added
    const [modificationPrompt, setModificationPrompt] = useState<string>(''); // Added
    const [isModifying, setIsModifying] = useState<boolean>(false); // Added

    const API_BASE_URL = 'https://api.tiendia.app';

    useEffect(() => {
        if (!user?.id) {
            setLoading(false);
            // Consider setting an error state or message here
            // setError("Usuario no autenticado.");
            return;
        }

        const fetchGeneratedImages = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_BASE_URL}/api/products/images/by-user/${user.id}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (!response.ok) {
                    let errorMsg = `Error ${response.status}: ${response.statusText}`;
                    try {
                        const errorBody = await response.json();
                        errorMsg = errorBody.message || errorMsg;
                    } catch (_) {
                        // ignore
                    }
                    throw new Error(errorMsg);
                }

                const data = await response.json();
                setImages(data.images || []);

            } catch (err: any) {
                console.error("Error fetching generated images:", err);
                setError(err.message || "No se pudieron cargar las imágenes generadas.");
            } finally {
                setLoading(false);
            }
        };

        fetchGeneratedImages();
    }, [user?.id]);

    const handleDownloadImage = async (event: React.MouseEvent | React.MouseEvent<HTMLButtonElement>, url: string, filename: string) => { // Allow button event
        event.stopPropagation();
        try {
            const noCacheUrl = `${url}?t=${Date.now()}`;
            const response = await fetch(noCacheUrl);
            console.log("Respuesta:", response);
            if (!response.ok) throw new Error('Network response was not ok.');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Error al descargar la imagen:', error);
            toast.error("Error al descargar la imagen."); // Added toast
        }
    };

    const openDeleteDialog = (event: React.MouseEvent, imageId: number) => {
        event.stopPropagation();
        setImageToDelete(imageId);
        setIsDeleteAlertOpen(true);
    };

    const confirmDeleteImage = async () => {
        if (imageToDelete === null) return;

        setIsDeleting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/products/images/${imageToDelete}`, {
                method: 'DELETE',
                credentials: 'include',
                 headers: {
                     // 'Authorization': `Bearer ${your_token}` // Añade si usas JWT
                 },
            });

            if (!response.ok) {
                let errorMsg = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorBody = await response.json();
                    errorMsg = errorBody.message || errorMsg;
                } catch (_) { /* ignore */ }
                throw new Error(errorMsg);
            }

            setImages(prevImages => prevImages.filter(img => img.imageId !== imageToDelete));

        } catch (err: any) {
            console.error("Error deleting image:", err);
            setError(err.message || "No se pudo eliminar la imagen.");
        } finally {
            setIsDeleteAlertOpen(false);
            setImageToDelete(null);
            setIsDeleting(false);
        }
    };

    // Function to open the modification dialog
    const openModifyDialog = (event: React.MouseEvent, image: GeneratedImage) => {
        event.stopPropagation();
        setCurrentModifyImageId(image.imageId);
        setCurrentModifyImageUrl(`${image.imageUrl}`);
        setModificationPrompt('');
        setIsModifying(false);
        setIsModifyDialogOpen(true);
    };

    // Function to handle image modification
    const handleModifyImage = async () => {
        if (!currentModifyImageId || !modificationPrompt) {
            toast.error('Por favor, ingresa las instrucciones para modificar la imagen.');
            return;
        }

        setIsModifying(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/products/images/modify/${currentModifyImageId}`, {
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
                const newImageUrl = `${result.modifiedImageUrl}`;
                console.log("URL de imagen modificada recibida:", newImageUrl);
                setUser(prevUser => (
                    prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
                ));
                setCurrentModifyImageUrl(newImageUrl); // Update the image URL in the dialog

                // Update the image in the main list
                setImages(prevImages =>
                    prevImages.map(img =>
                        img.imageId === currentModifyImageId
                            ? { ...img, imageUrl: result.modifiedImageUrl, imageId: result.imageId } // Update URL and potentially ID
                            : img
                    )
                );

                toast.success('¡Imagen modificada con éxito!');
                setModificationPrompt(''); // Clear prompt after success
            } else {
                console.error("La respuesta de la API no contiene 'modifiedImageUrl'. Respuesta:", result);
                toast.error('Error al obtener la imagen modificada.');
            }
        } catch (error: any) {
            console.error("Error al modificar el anuncio:", error);
            setError(error.message || 'Ocurrió un error al intentar modificar la imagen.');
            toast.error(error.message || 'Ocurrió un error al intentar modificar la imagen.');
        } finally {
            setIsModifying(false);
        }
    };

    const openImageViewDialog = (imageUrl: string) => {
        setSelectedImageUrl(`${imageUrl}`);
        setIsImageViewOpen(true);
    };


    const renderSkeletons = () => (
        Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="overflow-hidden bg-white dark:bg-gray-800 border dark:border-gray-700">
                <AspectRatio ratio={1 / 1} className="bg-muted dark:bg-gray-700">
                    <Skeleton className="w-full h-full bg-gray-200 dark:bg-gray-600" />
                </AspectRatio>
                <CardContent className="p-3">
                    <Skeleton className="h-4 w-3/4 mb-2 bg-gray-200 dark:bg-gray-600" />
                    <Skeleton className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600" />
                </CardContent>
            </Card>
        ))
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:pt-6 md:pl-72 pt-16 pl-4 pr-4 flex flex-col">
            <AdminSidebar />

            <header className="py-8">
                <h1 className="text-3xl md:text-4xl font-bold pl-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <ImageIcon className="w-8 h-8" /> Galería de Imágenes Generadas
                </h1>
            </header>

            <main className="p-4 flex-grow">
                {loading ? (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {renderSkeletons()}
                    </div>
                ) : error ? (
                    <Alert variant="destructive" className="max-w-lg mx-auto bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700/50 text-red-800 dark:text-red-200">
                        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                        <AlertTitle className="font-semibold">Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : images.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-200">No hay imágenes</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Aún no has generado ninguna imagen publicitaria para tus productos.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {images.map((image) => (
                            <Card
                                key={image.imageId}
                                className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer group relative bg-white dark:bg-gray-800 border dark:border-gray-700"
                                onClick={() => openImageViewDialog(image.imageUrl)}
                            >
                                <AspectRatio ratio={1 / 1} className="bg-muted dark:bg-gray-700/50 relative">
                                    <img
                                        src={`${image.imageUrl}`}
                                        alt={`Imagen generada para ${image.productName || 'producto'}`}
                                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                    />
                                    {/* Overlay with buttons shown on hover - only on desktop */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 dark:group-hover:bg-opacity-60 transition-opacity duration-300 hidden md:flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="bg-white/80 hover:bg-white text-gray-800 dark:bg-gray-700/80 dark:hover:bg-gray-600 dark:text-gray-100"
                                            onClick={(e) => handleDownloadImage(e, image.imageUrl, `tiendia-${image.productName || image.imageId}.png`)}
                                            title="Descargar Imagen"
                                        >
                                            <Download className="h-5 w-5" />
                                        </Button>
                                        <Button
                                           variant="outline"
                                           size="icon"
                                           className="bg-white/80 hover:bg-white text-blue-600 dark:bg-gray-700/80 dark:hover:bg-gray-600 dark:text-blue-400"
                                           onClick={(e) => openModifyDialog(e, image)}
                                           title="Modificar Imagen"
                                        >
                                           <Wand2 className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="bg-red-500/80 hover:bg-red-600/90 text-white dark:bg-red-600/80 dark:hover:bg-red-700/90 dark:text-red-100"
                                            onClick={(e) => openDeleteDialog(e, image.imageId)}
                                            title="Eliminar Imagen"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </AspectRatio>
                                <CardContent className="p-3">
                                    <p className="text-sm font-medium truncate text-gray-800 dark:text-gray-200" title={image.productName || 'Producto sin nombre'}>
                                        {image.productName || 'Producto sin nombre'}
                                    </p>
                                    {image.createdAt && (
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                                            Generada: {new Date(image.createdAt).toLocaleDateString()}
                                        </p>
                                    )}
                                    {/* Mobile buttons - shown at bottom */}
                                    <div className="flex justify-between items-center gap-2 mt-3 md:hidden">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                                            onClick={(e) => handleDownloadImage(e, image.imageUrl, `tiendia-${image.productName || image.imageId}.png`)}
                                        >
                                            <Download className="h-4 w-4 mr-1" />
                                        </Button>
                                        <Button
                                           variant="outline"
                                           size="sm"
                                           className="flex-1 bg-white hover:bg-gray-50 text-blue-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-blue-400"
                                           onClick={(e) => openModifyDialog(e, image)}
                                        >
                                           <Wand2 className="h-4 w-4 mr-1" />
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 dark:text-red-100"
                                            onClick={(e) => openDeleteDialog(e, image.imageId)}
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {/* Alert Dialog for Delete Confirmation */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="bg-white dark:bg-gray-900 border dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-gray-50">¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            Esta acción no se puede deshacer. Se eliminará permanentemente la imagen generada.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting} className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteImage} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 dark:bg-red-600 dark:hover:bg-red-700 dark:text-red-100">
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog for Image Preview */}
            <Dialog open={isImageViewOpen} onOpenChange={setIsImageViewOpen}>
                <DialogContent className="max-w-3xl p-0 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg overflow-hidden">
                    {selectedImageUrl && (
                        <img src={selectedImageUrl} alt="Vista previa de imagen generada" className="w-full h-auto" />
                    )}
                </DialogContent>
            </Dialog>

            {/* Dialog for Image Modification */}
            <Dialog open={isModifyDialogOpen} onOpenChange={setIsModifyDialogOpen}>
                <DialogContent className="sm:max-w-[525px] flex flex-col max-h-[90vh] bg-white dark:bg-gray-900 border dark:border-gray-700">
                    {isModifying ? (
                        <div className="flex items-center justify-center min-h-[300px] flex-col gap-4">
                            <div className="relative h-16 w-16">
                                <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-blue-500 animate-spin"></div>
                                <div className="absolute inset-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-75 animate-pulse"></div>
                                <div className="absolute inset-4 flex items-center justify-center text-blue-300">
                                    {/* <Wand2 className="h-6 w-6 animate-ping opacity-50" /> */}
                                </div>
                            </div>
                            <p className="text-muted-foreground dark:text-gray-400 animate-pulse">Modificando imagen...</p>
                        </div>
                    ) : (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-gray-900 dark:text-gray-50">Modificar Imagen <span role="img" aria-label="wand">🪄</span></DialogTitle>
                                <DialogDescription className="text-gray-600 dark:text-gray-400">
                                    {currentModifyImageUrl ? 'Modifica la imagen con nuevas instrucciones.' : 'Cargando imagen...'}
                                </DialogDescription>
                            </DialogHeader>

                            <ScrollArea className="mt-4 flex-1 overflow-y-auto pr-6">
                                <div>
                                    {currentModifyImageUrl ? (
                                        <img
                                            src={currentModifyImageUrl}
                                            alt="Imagen a modificar"
                                            className="rounded-md w-full h-auto object-contain"
                                        />
                                    ) : (
                                        <p className='text-center text-destructive'>No se pudo cargar la imagen para modificar.</p>
                                    )}
                                </div>
                                <ScrollBar orientation="vertical" />
                            </ScrollArea>

                            {/* Sección de Modificación y Descarga */}
                            {currentModifyImageUrl && (
                                <div className="mt-4 pt-4 border-t border-border dark:border-gray-700 space-y-4">
                                    {/* Campo para instrucciones de modificación */}
                                    <div className="space-y-2">
                                        <label htmlFor="modification-prompt" className="text-sm font-medium text-gray-700 dark:text-gray-300">Instrucciones para modificar:</label>
                                        <Textarea
                                            id="modification-prompt"
                                            placeholder="Ej: Haz el producto más grande..."
                                            value={modificationPrompt}
                                            onChange={(e) => setModificationPrompt(e.target.value)}
                                            className="min-h-[80px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={isModifying}
                                        />
                                        <p className="text-xs text-muted-foreground dark:text-gray-400">Costo de modificación: 1 imágen.</p>
                                    </div>

                                    {/* Botones */}
                                    <div className="flex justify-between items-center">
                                        <Button
                                            onClick={handleModifyImage}
                                            disabled={!modificationPrompt || isModifying}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-white"
                                        >
                                            {isModifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                            Modificar Imagen
                                        </Button>
                                        <Button
                                            onClick={(e) => handleDownloadImage(e, currentModifyImageUrl, `tiendia-modificada-${currentModifyImageId}.png`)}
                                            variant="outline"
                                            className="dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:border-gray-600"
                                            disabled={isModifying}
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

            <footer className="container py-8 text-sm text-muted-foreground dark:text-gray-400 mt-auto">
                <p>✨ tiendia.app - Transformando tu negocio con IA</p>
            </footer>
        </div>
    );
}

export default GeneratedImagesPage;