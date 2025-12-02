import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { FiEdit } from "react-icons/fi";
import { Card } from "./ui/card";
import { useState } from "react";
import { 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Pencil, 
  ChevronRight, 
  ImageIcon, 
  ArrowLeft, 
  User, 
  Baby, 
  School, 
  Accessibility, 
  Palette, 
  PersonStanding, 
  Shirt, 
  Eye,
  Check
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router";

const REQUIRED_CREDITS = 50;

export default function AdminProductCard({ product, handleGenerateAd, onEdit, updateGeneratedImage, setIsAdDialogOpen, setCurrentAdImageUrl, setOriginalImageUrl, setCurrentProductId, setLoading }: any) {
  const { name, imageURL } = product;
  const [isGenerating, setIsGenerating] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isModelImage, setIsModelImage] = useState(true);
  const [isRemoveBackgroundImage, setIsRemoveBackgroundImage] = useState(false);

  // Estados para opciones de personalización (Universal Image)
  const [pAgeGroup, setPAgeGroup] = useState('adult');
  const [pGender, setPGender] = useState('female');
  const [pSkinTone, setPSkinTone] = useState('medium');
  const [pBodyType, setPBodyType] = useState('slim');
  const [pView, setPView] = useState('front');
  const [pIsOutfit, setPIsOutfit] = useState(false);

  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;
  
  // Lógica original para generación estándar y remover fondo
  const handleGenerateClick = async () => {
    setIsGenerating(true);
    try {
      if (isModelImage) {
        // Llamada estándar a handleGenerateAd que viene de App.jsx
        await handleGenerateAd(product.id, true, product.imageURL, false);
      } else if (isRemoveBackgroundImage) {
        setIsAdDialogOpen(true);
        setCurrentAdImageUrl(null);
        setOriginalImageUrl(product.imageURL);
        setCurrentProductId(product.id);
        setLoading(true);
        
        const res = await fetch(`https://api.tiendia.app/api/products/remove-background-image/${product.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({}), 
        });
        
        const data = await res.json();
        if (res.ok && data.removeBackgroundImageUrl) {
          // Actualizado: Pasamos 'remove-background' como tipo
          if (typeof updateGeneratedImage === 'function') {
            updateGeneratedImage(data.removeBackgroundImageUrl, 'remove-background');
          }
          setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
        } else {
          alert(data.message || 'Error al generar la imagen de fondo');
        }
      }

    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  // Nueva lógica para Personalización Avanzada (Universal Endpoint)
  const handlePersonalizedGenerate = async () => {
    if (!hasEnoughCredits) {
      navigate('/credits');
      return;
    }

    setIsGenerating(true);
    setIsAdDialogOpen(true);
    setCurrentAdImageUrl(null);
    setOriginalImageUrl(product.imageURL);
    setCurrentProductId(product.id);
    setLoading(true);
    setDrawerOpen(false); 

    try {
      const payload = {
        ageGroup: pAgeGroup,
        gender: pGender,
        skinTone: pSkinTone,
        bodyType: pBodyType,
        view: pView,
        isOutfit: pIsOutfit
      };

      const res = await fetch(`https://api.tiendia.app/api/products/universal-image/${product.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.imageUrl) {
        // Actualizado: Pasamos 'universal' como tipo y el payload para poder regenerar
        if (typeof updateGeneratedImage === 'function') {
          updateGeneratedImage(data.imageUrl, 'universal', payload);
        }
        setUser(prevUser => (prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null));
      } else {
        alert(data.message || 'Error al generar la imagen personalizada');
        setLoading(false); 
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión al generar la imagen');
      setLoading(false);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={(open) => { 
      setDrawerOpen(open); 
    }}>
      <DrawerTrigger asChild>
        {/* CARD PRINCIPAL */}
        <Card 
          className="group relative h-[360px] w-full max-w-[300px] my-2 overflow-hidden rounded-3xl border-0 bg-gray-100 dark:bg-gray-800 shadow-lg shadow-black/40 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer mx-auto"
          onClick={() => setDrawerOpen(true)}
        >
          {/* 1. IMAGEN DE FONDO (Full Bleed) */}
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-gray-900">
            {imageURL ? (
              <img
                src={imageURL}
                alt={name}
                className="h-full w-full object-cover transition-transform duration-700 will-change-transform group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <ImageIcon className="mb-2 h-12 w-12 opacity-30" />
                <span className="text-sm font-medium opacity-50">Sin imagen</span>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
          </div>

          <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col justify-end px-5 pb-5 pt-32 
            bg-gradient-to-t 
            from-white/45 via-white/40 to-transparent 
            dark:from-gray-900 dark:via-gray-900/60 dark:to-transparent
            transition-all duration-300"
          >
            {/* Nombre del producto */}
            <h3 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white drop-shadow-sm line-clamp-2">
              {name}
            </h3>
            
            {/* Indicador visual hover */}
            <div className="mt-2 flex items-center justify-between opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
               <span className="text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider">Editar</span>
               <div className="h-1 w-8 rounded-full bg-blue-600"></div>
            </div>
          </div>
        </Card>
      </DrawerTrigger>

      <DrawerContent className="max-h-[95vh] bg-white dark:bg-gray-900">
          
        <div className="mx-auto w-full max-w-md p-4">

          {
            personalizing
            ?
            (
              <div className="flex flex-col h-full">
                {/* Header Personalización */}
                <div className="flex items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="mr-2 h-8 w-8" 
                        onClick={() => setPersonalizing(false)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h3 className="font-semibold text-lg">Personalizar IA</h3>
                </div>

                {/* Contenido Scrolleable - Altura fija para evitar estiramiento */}
                <div className="h-[50vh] overflow-y-auto pr-2 space-y-5 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                    
                    {/* Edad */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                           <Baby className="w-3 h-3" /> Edad
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { id: 'baby', label: 'Bebé', icon: <Baby className="w-4 h-4" /> },
                                { id: 'child', label: 'Niño', icon: <School className="w-4 h-4" /> },
                                { id: 'adult', label: 'Adulto', icon: <User className="w-4 h-4" /> },
                                { id: 'senior', label: 'Mayor', icon: <Accessibility className="w-4 h-4" /> },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPAgeGroup(opt.id)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                                        pAgeGroup === opt.id 
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {opt.icon}
                                    <span className="text-[10px] font-medium mt-1">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Género */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                           <User className="w-3 h-3" /> Género
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                             {[
                                { id: 'female', label: 'Femenino' },
                                { id: 'male', label: 'Masculino' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPGender(opt.id)}
                                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                        pGender === opt.id 
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tono de Piel */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                           <Palette className="w-3 h-3" /> Tono de Piel
                        </label>
                        <div className="flex justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                            {[
                                { id: 'light', color: '#f5d0b0', label: 'Claro' },
                                { id: 'medium', color: '#dca779', label: 'Medio' },
                                { id: 'olive', color: '#c68642', label: 'Oliva' },
                                { id: 'dark', color: '#8d5524', label: 'Oscuro' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPSkinTone(opt.id)}
                                    className={`relative w-12 h-12 rounded-full border-2 transition-transform hover:scale-105 ${
                                        pSkinTone === opt.id ? 'border-blue-500 scale-110 shadow-sm' : 'border-transparent'
                                    }`}
                                    style={{ backgroundColor: opt.color }}
                                    title={opt.label}
                                >
                                    {pSkinTone === opt.id && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Check className="w-5 h-5 text-white drop-shadow-md" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tipo de Cuerpo (Solo adultos) */}
                    {pAgeGroup !== 'baby' && pAgeGroup !== 'child' && (
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                               <PersonStanding className="w-3 h-3" /> Cuerpo
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'slim', label: 'Delgado' },
                                    { id: 'athletic', label: 'Atlético' },
                                    { id: 'curvy', label: 'Curvy' },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setPBodyType(opt.id)}
                                        className={`py-2 px-1 rounded-lg border text-xs font-medium transition-all ${
                                            pBodyType === opt.id 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:border-blue-500 dark:text-blue-400' 
                                            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Vista */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                           <Eye className="w-3 h-3" /> Vista
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                             {[
                                { id: 'front', label: 'Frontal' },
                                { id: 'back', label: 'Trasera' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPView(opt.id)}
                                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                        pView === opt.id 
                                        ? 'bg-purple-50 border-purple-500 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500 dark:text-purple-400' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Estilo (Prenda vs Conjunto) */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                           <Shirt className="w-3 h-3" /> Estilo
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                             {[
                                { id: false, label: 'Prenda Única' },
                                { id: true, label: 'Conjunto' },
                            ].map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => setPIsOutfit(opt.id)}
                                    className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                                        pIsOutfit === opt.id 
                                        ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400' 
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Botón de Acción Personalizado */}
                <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg py-6 rounded-xl"
                        onClick={handlePersonalizedGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Generando...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generar Imagen
                                <span className="ml-2 bg-white/20 px-2 py-0.5 rounded text-xs">50c</span>
                            </>
                        )}
                    </Button>
                </div>
              </div>
            )
            :
            (
              <>
                <div className="rounded-lg overflow-hidden mb-4 shadow-sm border border-gray-200 dark:border-gray-700">
                {imageURL ? (
                    <img
                      src={imageURL}
                      alt={name}
                      className="w-full h-52 object-contain p-2 bg-gray-50 dark:bg-gray-800"
                    />
                  ) : (
                    <div className="w-full h-52 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">Sin Imagen</div>
                  )}
                </div>


                  <div className="flex items-center justify-center space-x-2 mb-4">
                    {[
                      { label: 'Con Modelo', value: 'model', emoji: '🧍' },
                      { label: 'Quitar Fondo', value: 'remove-background', emoji: '👕' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          if (opt.value === 'model') {
                          setIsModelImage(true);
                          setIsRemoveBackgroundImage(false);
                          } else if (opt.value === 'remove-background') {
                          setIsModelImage(false);
                          setIsRemoveBackgroundImage(true);
                          }
                        }}
                        className={`flex flex-col items-center px-2 py-2 rounded-lg border-2 transition-all font-medium text-sm
                          ${
                            (opt.value === 'model' && isModelImage) ||
                            (opt.value === 'remove-background' && isRemoveBackgroundImage)
                              ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                          }
                        `}
                      >
                        <span className="text-2xl mb-1">{opt.emoji}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>

                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-2 text-sm">Opciones de Generación</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className={`w-full rounded-xl transition-all duration-300 ease-in-out px-4 py-3 h-auto flex items-center justify-between text-left border border-gray-200/50 dark:border-gray-700/50 border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-sm hover:shadow-md`}
                      onClick={() => {
                      if (isModelImage) {
                        setPersonalizing(true);
                      }
                      }}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 transition-all duration-300 bg-gray-100/80 dark:bg-gray-800/80 group-hover:bg-gray-200/90 dark:group-hover:bg-gray-700/90`}>
                          <Pencil className="w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <span className={`font-medium text-sm text-gray-700 dark:text-gray-300 tracking-tight`}>Personalizar</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Button>
                  </div>
                </div>
          </>
            )
          }


          <div className="grid grid-cols-5 gap-3">
              {/* Solo mostramos el botón de generar principal si NO estamos personalizando */}
              {!personalizing && (
                <DrawerClose className="w-full col-span-4">
                    <Button
                    className={`w-full transition-all duration-300 rounded-lg py-3 h-auto text-sm font-semibold flex items-center justify-center gap-2 
                    bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white shadow-md hover:shadow-lg`}
                    onClick={async () => {
                        if ((user?.credits ?? 0) < 50) {
                        navigate('/credits')
                        }
                        else {
                        await handleGenerateClick();
                        }
                    }}
                    disabled={isGenerating}
                    >
                    {!imageURL ? (
                        <>
                        <AlertCircle className="w-4 h-4" />
                        <span>Falta Imagen</span>
                        </>
                    ) : (!hasEnoughCredits) ? (
                        <>
                        <Button
                            variant="link"
                            className="p-0 h-auto ml-1"
                            onClick={() => { navigate('/credits') }}
                        >
                            Recargar
                        </Button>
                        </>
                    ) : isGenerating ? (
                        <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando...</span>
                        </>
                    ) : (
                        <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generar 1 imagen</span>
                        </>
                    )}
                    </Button>
                </DrawerClose>
              )}

            {/* El botón de editar se mantiene o se oculta al personalizar según preferencia, aquí lo oculto si estamos personalizando para limpiar UI */}
            {!personalizing && (
                <DrawerClose className="w-full col-span-1">
                    <Button
                        variant="outline"
                        className="w-full rounded-lg py-3 h-auto flex items-center justify-center border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onClick={onEdit}
                        aria-label="Editar Producto"
                    >
                        <FiEdit className="w-5 h-5" />
                    </Button>
                </DrawerClose>
            )}
            </div>

          </div>
      
      </DrawerContent>
    </Drawer>
  );
}