// src/components/AdminProductCard.jsx
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { FiEdit  } from "react-icons/fi";
import { Card } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import { useState } from "react";
import { AlertCircle, Sparkles,  Loader2, Pencil, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router";

interface Product {
  id: number;
  imageURL: string | null;
  name: string;
}

// Créditos necesarios para generar un anuncio
const REQUIRED_CREDITS = 50;
// const REQUIRED_PRO_CREDITS = 100; // Double credits for Pro generation

const ageOptions = [
  { value: 'youth', label: 'Joven', icon: '🧑' },
  { value: 'adult', label: 'Adulto', icon: '🧔' },
  { value: 'senior', label: 'Mayor', icon: '👴' },
];
const genderOptions = [
  { value: 'male', label: 'Masculino', icon: '👨' },
  { value: 'female', label: 'Femenino', icon: '👩' },
];
const skinToneOptions = [
  { value: 'light', label: 'Claro', color: '#fff' },
  { value: 'medium', label: 'Medio', color: '#f3e0c7' },
  { value: 'dark', label: 'Oscuro', color: '#8d5524' },
];
const bodyTypeOptions = [
  { value: 'slim', label: 'Delgado', icon: '⚡' },
  { value: 'athletic', label: 'Atlético', icon: '💪' },
  { value: 'curvy', label: 'Curvy', icon: '✴️' },
];

export default function AdminProductCard({ product, handleGenerateAd, onEdit, updateGeneratedImage, updatePersonalizationSettings, setPersonalizedImageFlag, setIsAdDialogOpen, setCurrentAdImageUrl, setOriginalImageUrl, setCurrentProductId, setLoading }: {
  product: Product;
  handleGenerateAd: (id: number, includeModel: boolean, originalImageUrl: string | null, isPro: boolean) => void;
  onEdit: () => void;
  updateGeneratedImage: (imageUrl: string, isFrontView: boolean, isAdultView: boolean) => void;
  updatePersonalizationSettings: (settings: {
    gender?: string;
    age?: string;
    skinTone?: string;
    bodyType?: string;
  } | null) => void;
  setPersonalizedImageFlag: (isPersonalized: boolean) => void;
  setIsAdDialogOpen: (open: boolean) => void;
  setCurrentAdImageUrl: (url: string | null) => void;
  setOriginalImageUrl: (url: string | null) => void;
  setCurrentProductId: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
}) {
  const { name, imageURL } = product;
  const [isGenerating, setIsGenerating] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedSkinTone, setSelectedSkinTone] = useState<string | null>(null);
  const [selectedBodyType, setSelectedBodyType] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isFrontView, setIsFrontView] = useState(true);
  const [isAdultView, setIsAdultView] = useState(true);
  const [isKidView, setIsKidView] = useState<boolean | null>(null);
  const [isBabyView, setIsBabyView] = useState<boolean | null>(null);

  // Obtener información del usuario actual
  const { user, setUser } = useAuth();

  const navigate = useNavigate();

  // Verificar si el usuario tiene suficientes créditos
  const hasEnoughCredits = user && user.credits >= REQUIRED_CREDITS;
  
  const handleGenerateClick = async () => {
    setIsGenerating(true);
    console.log(isAdultView, isBabyView, isKidView);
    try {
      if (isFrontView && isAdultView) {
        // Generate front view adult (normal generation)
        await handleGenerateAd(product.id, true, product.imageURL, false);
      } else if (!isFrontView && isAdultView) {
        // Generate back view adult
        // Show dialog and loading state, set up comparison view
        setIsAdDialogOpen(true);
        setCurrentAdImageUrl(null);
        setOriginalImageUrl(product.imageURL);
        setCurrentProductId(product.id);
        setLoading(true);
        
        const res = await fetch(`https://api.tiendia.app/api/products/back-image/${product.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}), // Empty payload for default back view
        });
        
        const data = await res.json();
        if (res.ok && data.backImageUrl) {
          if (typeof updateGeneratedImage === 'function') {
            updateGeneratedImage(data.backImageUrl, false, true);
          }
          // Descontar 50 créditos por imagen de espalda
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
        } else {
          alert(data.message || 'Error al generar la imagen de vista trasera');
        }
      } else if (isBabyView) {
        // Generate front view baby
        // Show dialog and loading state, set up comparison view
        setIsAdDialogOpen(true);
        setCurrentAdImageUrl(null);
        setOriginalImageUrl(product.imageURL);
        setCurrentProductId(product.id);
        setLoading(true);
        
        const res = await fetch(`https://api.tiendia.app/api/products/baby-image/${product.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}), // Empty payload for default baby view
        });
        
        const data = await res.json();
        if (res.ok && data.babyImageUrl) {
          if (typeof updateGeneratedImage === 'function') {
            updateGeneratedImage(data.babyImageUrl, true, false);
          }
          // Descontar 50 créditos por imagen de bebé
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
        } else {
          alert(data.message || 'Error al generar la imagen de bebé');
        }
      } else if (isKidView) {
        setIsAdDialogOpen(true);
        setCurrentAdImageUrl(null);
        setOriginalImageUrl(product.imageURL);
        setCurrentProductId(product.id);
        setLoading(true);
        
        const res = await fetch(`https://api.tiendia.app/api/products/kid-image/${product.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({}), // Empty payload for default kid view
        });
        
        const data = await res.json();
        if (res.ok && data.kidImageUrl) {
          if (typeof updateGeneratedImage === 'function') {
            updateGeneratedImage(data.kidImageUrl, false, false);
          }
          // Descontar 50 créditos por imagen de niño
          setUser(prevUser => (
            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
          ));
        } else {
          alert(data.message || 'Error al generar la imagen de niño');
        }
      }
    } finally {
      setIsGenerating(false);
      setLoading(false);
    }
  };

  return (
    <Drawer open={drawerOpen} onOpenChange={(open) => { 
      setDrawerOpen(open); 
      if (!open) {
        setPersonalizing(false);
      }
    }}>
      <DrawerTrigger asChild>
        <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] h-full hover:cursor-pointer w-full md:max-w-[280px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700" onClick={() => setDrawerOpen(true)}>
          <div className="w-full border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <AspectRatio ratio={4 / 3}>
              {imageURL ? (
                <img
                  src={imageURL}
                  alt={name}
                  className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105 p-2"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </AspectRatio>
          </div>
          <div className="p-4 flex flex-col justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold truncate text-gray-800 dark:text-gray-100">{name}</h3>
            </div>
          </div>
        </Card>
      </DrawerTrigger>

        <DrawerContent className="max-h-[95vh] bg-white dark:bg-gray-900">
          
        {
          personalizing ? (
            <div className="h-[95vh] flex flex-col items-center justify-center bg-[#0a1837] text-white px-4">
              <div className="w-full max-w-xs mx-auto rounded-2xl bg-[#14244a] p-5 shadow-lg">
                <button onClick={() => setPersonalizing(false)} className="text-blue-300 text-sm mb-2 flex items-center gap-1 hover:underline">
                  <span className="text-lg">←</span> Volver
                </button>
                <h2 className="text-lg font-semibold mb-4 text-center">Personalizar Modelo</h2>
                <div className="flex justify-between gap-2 mb-4">
                  {genderOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedGender(selectedGender === opt.value ? null : opt.value)}
                      className={`flex-1 py-2 rounded-lg font-medium flex flex-col items-center border-2 transition-all ${selectedGender === opt.value ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1a2a4d] border-[#22335c] text-blue-200'}`}
                    >
                      <span className="text-2xl mb-1">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mb-2 text-sm font-medium">Edad</div>
                <div className="flex justify-between gap-2 mb-4">
                  {ageOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedAge(selectedAge === opt.value ? null : opt.value)}
                      className={`flex-1 py-2 rounded-lg font-medium flex flex-col items-center border-2 transition-all ${selectedAge === opt.value ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1a2a4d] border-[#22335c] text-blue-200'}`}
                    >
                      <span className="text-2xl mb-1">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mb-2 text-sm font-medium">Tono de Piel</div>
                <div className="flex justify-between gap-2 mb-4">
                  {skinToneOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedSkinTone(selectedSkinTone === opt.value ? null : opt.value)}
                      className={`flex-1 py-2 rounded-lg font-medium flex flex-col items-center border-2 transition-all ${selectedSkinTone === opt.value ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1a2a4d] border-[#22335c] text-blue-200'}`}
                    >
                      <span className="w-6 h-6 rounded-full mb-1 border" style={{ background: opt.color, borderColor: selectedSkinTone === opt.value ? '#fff' : '#22335c' }}></span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="mb-2 text-sm font-medium">Tipo de Cuerpo</div>
                <div className="flex justify-between gap-2 mb-4">
                  {bodyTypeOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedBodyType(selectedBodyType === opt.value ? null : opt.value)}
                      className={`flex-1 py-2 rounded-lg font-medium flex flex-col items-center border-2 transition-all ${selectedBodyType === opt.value ? 'bg-blue-600 border-blue-400 text-white' : 'bg-[#1a2a4d] border-[#22335c] text-blue-200'}`}
                    >
                      <span className="text-2xl mb-1">{opt.icon}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  className="w-full mt-4 py-3 rounded-lg bg-blue-400 hover:bg-blue-500 text-white font-semibold text-base transition-all"
                  onClick={async () => {
                    if (!selectedGender && !selectedAge && !selectedSkinTone && !selectedBodyType) {
                      setPersonalizing(false);
                      handleGenerateClick();
                    } else {
                      const payload: any = {};
                      if (selectedGender) payload.gender = selectedGender;
                      if (selectedAge) payload.age = selectedAge;
                      if (selectedSkinTone) payload.skinTone = selectedSkinTone;
                      if (selectedBodyType) payload.bodyType = selectedBodyType;

                      // Show dialog and loading state, set up comparison view
                      setIsAdDialogOpen(true);
                      setCurrentAdImageUrl(null);
                      setOriginalImageUrl(product.imageURL);
                      setCurrentProductId(product.id);
                      setLoading(true);
                      setPersonalizing(false);

                      // Update personalization settings in parent component
                      updatePersonalizationSettings(payload);

                      try {
                        setIsGenerating(true);
                        let endpoint;
                        if (isFrontView && isAdultView) {
                          endpoint = `https://api.tiendia.app/api/products/personalize/${product.id}`;
                        } else if (!isFrontView && isAdultView) {
                          endpoint = `https://api.tiendia.app/api/products/back-image/${product.id}`;
                        } else {
                          endpoint = `https://api.tiendia.app/api/products/baby-image/${product.id}`;
                        }
                        
                        const res = await fetch(endpoint, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify(payload),
                        });
                        const data = await res.json();
                        
                        let imageUrl;
                        if (isFrontView && isAdultView) {
                          imageUrl = data.personalizedImageUrl;
                        } else if (!isFrontView && isAdultView) {
                          imageUrl = data.backImageUrl;
                        } else {
                          imageUrl = data.babyImageUrl;
                        }
                        
                        if (res.ok && imageUrl) {
                          if (typeof updateGeneratedImage === 'function') {
                            updateGeneratedImage(imageUrl, isFrontView, isAdultView);
                          }
                          setPersonalizedImageFlag(true);
                          // Descontar 50 créditos por imagen personalizada
                          setUser(prevUser => (
                            prevUser ? { ...prevUser, credits: prevUser.credits - 50 } : null
                          ));
                        } else {
                          alert(data.message || `Error al generar la imagen ${isFrontView ? 'personalizada' : 'de vista trasera'}`);
                        }
                      } catch (err) {
                        alert(`Error de red al generar la imagen ${isFrontView ? 'personalizada' : 'de vista trasera'}`);
                      } finally {
                        setIsGenerating(false);
                        setLoading(false);
                      }
                    }
                  }}
                >
                  Generar con estas opciones
                </button>
              </div>
            </div>
          )
          :
        <div className="mx-auto w-full max-w-md p-4">
           <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 dark:bg-gray-700 mb-4" />

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

            <div className="text-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
                  {product.name}
                </h2>
             </div>

             <div className="flex items-center justify-center space-x-4 mb-4">
               <span className={`text-sm font-medium transition-colors ${isFrontView ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                 Frente
               </span>
               <Switch
                 checked={!isFrontView}
                 onCheckedChange={(checked) => isAdultView ? setIsFrontView(!checked) : setIsFrontView(true)}
                 className="data-[state=checked]:bg-blue-600"
               />
               <span className={`text-sm font-medium transition-colors ${!isFrontView ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                 Detrás
               </span>
             </div>

             <div className="flex items-center justify-center space-x-4 mb-4">
               {/* Edad: Bebé, Niño, Adulto con emojis */}
               {[
                 { label: 'Bebé', value: 'bebe', emoji: '👶' },
                 { label: 'Niño', value: 'nino', emoji: '🧒' },
                 { label: 'Adulto', value: 'adulto', emoji: '🧑' },
               ].map(opt => (
                 <button
                   key={opt.value}
                   onClick={() => {
                     if (opt.value === 'bebe') {
                       setIsAdultView(false);
                       setIsKidView(false);
                       setIsBabyView(true);
                       setIsFrontView(true);
                     } else if (opt.value === 'nino') {
                       setIsAdultView(false);
                       setIsKidView(true);
                       setIsBabyView(false);
                       setIsFrontView(true);
                     } else {
                       setIsAdultView(true);
                       setIsKidView(false);
                       setIsBabyView(false);
                     }
                   }}
                   className={`flex flex-col items-center px-3 py-2 rounded-lg border-2 transition-all font-medium text-sm
                     ${
                       (opt.value === 'bebe' && !isAdultView && (!isKidView || typeof isKidView === 'undefined')) ||
                       (opt.value === 'nino' && !isAdultView && isKidView) ||
                       (opt.value === 'adulto' && isAdultView)
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
                 onClick={() => setPersonalizing(true)}
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

          <div className="grid grid-cols-5 gap-3">
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
            </div>

          </div>
      }
      </DrawerContent>
    </Drawer>
  );
}