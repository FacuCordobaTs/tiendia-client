import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Store, Smartphone, Package, Image, Link, MessageCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { name: 'Argentina', code: 'AR', dialCode: '54', flag: '🇦🇷' },
  { name: 'Brazil', code: 'BR', dialCode: '55', flag: '🇧🇷' },
  { name: 'Chile', code: 'CL', dialCode: '56', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', dialCode: '57', flag: '🇨🇴' },
  { name: 'Mexico', code: 'MX', dialCode: '52', flag: '🇲🇽' },
  { name: 'Peru', code: 'PE', dialCode: '51', flag: '🇵🇪' },
  { name: 'Uruguay', code: 'UY', dialCode: '598', flag: '🇺🇾' },
  { name: 'Paraguay', code: 'PY', dialCode: '595', flag: '🇵🇾' },
  { name: 'Bolivia', code: 'BO', dialCode: '591', flag: '🇧🇴' },
  { name: 'República Dominicana', code: 'DO', dialCode: '1', flag: '🇩🇴' },
  { name: 'Guatemala', code: 'GT', dialCode: '502', flag: '🇬🇹' },
  { name: 'Costa Rica', code: 'CR', dialCode: '506', flag: '🇨🇷' },
  { name: 'Malaysia', code: 'MY', dialCode: '60', flag: '🇲🇾' },
  { name: 'Indonesia', code: 'ID', dialCode: '62', flag: '🇮🇩' },
  { name: 'Kenya', code: 'KE', dialCode: '254', flag: '🇰🇪' },
  { name: 'Nigeria', code: 'NG', dialCode: '234', flag: '🇳🇬' },
];

function MiTiendiaForm() {
  const [storeName, setStoreName] = useState('');
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]); // Default to Argentina
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Autocomplete fields with existing user data when user data is available
  useEffect(() => {
    if (user && !loading) {
      // Autocomplete fields with existing data
      if (user.name) {
        setStoreName(user.name);
      }
      
      if (user.phone) {
        setPhoneNumber(user.phone);
        
        // Try to determine country from phone number
        const phoneWithoutPlus = user.phone.replace('+', '');
        const country = COUNTRIES.find(c => phoneWithoutPlus.startsWith(c.dialCode));
        if (country) {
          setSelectedCountry(country);
        }
      }
      
      if (user.imageUrl) {
        setLogoPreview(user.imageUrl);
      }
    }
  }, [user, loading]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB.');
        return;
      }

      setStoreLogo(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
      // Update phone number to include new country code
      const cleanNumber = phoneNumber.replace(/^\+?\d+\s*/, '');
      setPhoneNumber(`+${country.dialCode} ${cleanNumber}`);
    }
  };

  const handlePhoneChange = (value: string) => {
    // Remove any existing country code and format
    const cleanNumber = value.replace(/^\+?\d+\s*/, '');
    setPhoneNumber(`+${selectedCountry.dialCode} ${cleanNumber}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeName.trim() || !phoneNumber.trim()) {
      toast.error('Por favor completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare form data
      const formData = {
        storeName: storeName.trim(),
        storeLogo: logoPreview || undefined, // Send base64 image if available
        phoneNumber: phoneNumber.trim(),
        countryCode: selectedCountry.code
      };

      // Call the MiTiendia API endpoint
      const response = await fetch('https://api.tiendia.app/api/auth/mi-tiendia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la tienda');
      }
      
      toast.success('¡Tu tienda virtual se ha creado exitosamente!');
      
      // Navigate to product pricing page
      navigate('/product-pricing');
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast.error(error.message || 'Error al crear la tienda. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateStoreUrl = (name: string) => {
    if (!name.trim()) return 'my.tiendia.app/...';
    
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    return `my.tiendia.app/${cleanName}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Mi Tiendia
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.paidMiTienda ? 'Edita tu tienda virtual' : 'Crea tu tienda virtual'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Intro Section - Glass Card */}
          <div className="mb-8">
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/50 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {user?.paidMiTienda ? 'Tu Tienda Virtual' : 'Tu Tienda Virtual'}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  {user?.paidMiTienda 
                    ? 'Edita la información de tu tienda virtual y recibe pedidos directamente por WhatsApp'
                    : 'Crea una tienda virtual profesional con tus productos y recibe pedidos directamente por WhatsApp'
                  }
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Control de Stock
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gestiona tu inventario automáticamente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Gestión de Talles
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Administra talles y variantes fácilmente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Image className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Imágenes con IA
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Usa las imágenes generadas por IA
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                    <Link className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Link Personalizado
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tu tienda con URL única
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Pedidos por WhatsApp
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Recibe pedidos directamente
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/50 dark:bg-gray-700/50 rounded-2xl border border-white/30 dark:border-gray-600/30">
                  <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      Responsive
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Optimizada para móviles
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section - Glass Card */}
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/50 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de tu Tienda
                </label>
                <Input
                  id="storeName"
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej: Mi Tienda de Ropa"
                  className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
                  required
                />
                
                {/* Dynamic URL Preview */}
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tu tienda aparecerá en:</p>
                  <p className="text-sm font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                    {generateStoreUrl(storeName)}
                  </p>
                </div>
              </div>

              {/* Store Logo Upload */}
              <div>
                <label htmlFor="storeLogo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Logo de tu Tienda (Opcional)
                </label>
                <div className="space-y-3">
                  <Input
                    id="storeLogo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="block w-full text-sm text-gray-900 border-2 border-gray-200 dark:border-gray-600 rounded-2xl cursor-pointer bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900 dark:file:text-purple-300"
                  />
                  {logoPreview && (
                    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-600">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {storeLogo?.name || 'Logo actual'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {storeLogo ? (storeLogo.size / 1024 / 1024).toFixed(2) : '0'} MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Country and Phone Number */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    País
                  </label>
                  <Select onValueChange={handleCountryChange} defaultValue={selectedCountry.code}>
                    <SelectTrigger className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm">
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            <span>{country.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="md:col-span-2">
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Número de WhatsApp
                  </label>
                  <div className="relative">
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder={`+${selectedCountry.dialCode} 9 11 1234-5678`}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm pl-12"
                      required
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <MessageCircle className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Los clientes te contactarán por este número
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || !storeName.trim() || !phoneNumber.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {user?.paidMiTienda ? 'Actualizando tu tienda...' : 'Creando tu tienda...'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      {user?.paidMiTienda ? 'Actualizar Tienda' : 'Continuar'}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Info Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Tu tienda se creará automáticamente con los productos que ya tienes subidos
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiTiendiaForm; 