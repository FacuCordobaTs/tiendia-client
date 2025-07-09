import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Store, Smartphone, Package, Image, Link, MessageCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function MiTiendiaForm() {
  const [storeName, setStoreName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!storeName.trim() || !phoneNumber.trim()) {
      toast.error('Por favor completa todos los campos.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // TODO: Implement API call to create Mi Tiendia store
      // For now, just show success message
      toast.success('¡Tu tienda virtual se está creando!');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate back to home or to the created store
      navigate('/');
    } catch (error) {
      console.error('Error creating store:', error);
      toast.error('Error al crear la tienda. Intenta nuevamente.');
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
                Crea tu tienda virtual
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Intro Section - Glass Card */}
        <div className="mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl mb-4 shadow-lg">
                <Store className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                Tu Tienda Virtual
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Crea una tienda virtual profesional con tus productos y recibe pedidos directamente por WhatsApp
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

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número de WhatsApp
              </label>
              <div className="relative">
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
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

            <div className="pt-6">
              <Button
                type="submit"
                disabled={isSubmitting || !storeName.trim() || !phoneNumber.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 px-8 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creando tu tienda...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Crear Mi Tiendia
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
    </div>
  );
}

export default MiTiendiaForm; 