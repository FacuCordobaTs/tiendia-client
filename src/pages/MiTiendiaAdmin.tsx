import { useState, useEffect, useRef } from 'react';
import { Store, Phone, Package, DollarSign, Edit, Save, X, Plus, Trash2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';
import { useNavigate } from 'react-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StoreData {
  name: string;
  username: string;
  phone: string;
  imageUrl?: string;
  countryCode?: string;
}

interface Product {
  id: number;
  name: string;
  imageURL: string;
  price?: number;
  sizes?: string;
}

interface Size { 
  name: string;
  stock: number;
}

function MiTiendiaAdmin() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isPaid, setIsPaid] = useState(true);
  const navigate = useNavigate();
  
  const [storeForm, setStoreForm] = useState<StoreData>({
    name: '',
    username: '',
    phone: '',
    imageUrl: '',
    countryCode: ''
  });

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    imageURL: '',
    sizes: [] as Size[]
  });

  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    imageURL: '',
    sizes: [] as Size[]
  });

  const [quotaDueDate, setQuotaDueDate] = useState<Date | null>(null);
  const [logoEditMode, setLogoEditMode] = useState(false);
  const [newLogoPreview, setNewLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [addingSizeIndex, setAddingSizeIndex] = useState<number | null>(null);
  const [addingSizeValue, setAddingSizeValue] = useState('');
  const [addingSizeIsNew, setAddingSizeIsNew] = useState(false);
  const sizeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setIsLoading(true);
      
      const profileResponse = await fetch('https://api.tiendia.app/api/auth/profile', {
        credentials: 'include'
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const profileData = await profileResponse.json();
      const user = profileData.user[0];

      const gracePeriodEnd = new Date(user.paidMiTiendaDate);
      gracePeriodEnd.setMonth(gracePeriodEnd.getMonth() + 1);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2);
      
      const now = new Date();
      setIsPaid(now < gracePeriodEnd);
      setQuotaDueDate(gracePeriodEnd);
      
      const storeData: StoreData = {
        name: user.name || '',
        username: user.username || '',
        phone: user.phone || '',
        imageUrl: user.imageUrl || '',
        countryCode: user.countryCode || ''
      };

      if (user.phone && user.phone.includes(' ')) {
        const [countryCode, phoneNumber] = user.phone.split(' ', 2);
        storeData.countryCode = countryCode;
        storeData.phone = phoneNumber;
      }
      
      setStore(storeData);
      setStoreForm(storeData);

      const productsResponse = await fetch(`https://api.tiendia.app/api/products/list/${user.id}`, {
        credentials: 'include'
      });
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
      toast.error('Error al cargar los datos de la tienda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreSave = async () => {
    try {
      const response = await fetch('https://api.tiendia.app/api/auth/mi-tiendia', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          storeName: storeForm.name,
          storeLogo: storeForm.imageUrl?.startsWith('data:') ? storeForm.imageUrl : undefined,
          phoneNumber: storeForm.countryCode + " " + storeForm.phone,
          countryCode: storeForm.countryCode
        })
      });

      if (response.ok) {
        setStore(storeForm);
        setIsEditingStore(false);
        toast.success('Tienda actualizada correctamente');
      } else {
        throw new Error('Failed to update store');
      }
    } catch (error) {
      console.error('Error updating store:', error);
      toast.error('Error al actualizar la tienda');
    }
  };

  const handleProductSave = async (productId: number) => {
    try {
      const response = await fetch('https://api.tiendia.app/api/products/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: productId,
          name: productForm.name,
          imageBase64: productForm.imageURL?.startsWith('data:') ? productForm.imageURL : undefined,
        })
      });

      if (response.ok) {
        if (productForm.price || productForm.sizes.length > 0) {
          const pricingResponse = await fetch('https://api.tiendia.app/api/products/update-pricing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              products: [{
                id: productId,
                price: productForm.price ? parseFloat(productForm.price) : undefined,
                sizes: productForm.sizes.length > 0 ? productForm.sizes : undefined
              }]
            })
          });

          if (!pricingResponse.ok) {
            console.warn('Failed to update product pricing');
          }
        }

        await fetchStoreData();
        setEditingProductId(null);
        toast.success('Producto actualizado correctamente');
      } else {
        throw new Error('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const handleAddProduct = async () => {
    try {
      if (!newProductForm.imageURL) {
        toast.error('Se requiere una imagen para crear el producto');
        return;
      }

      const response = await fetch('https://api.tiendia.app/api/products/generate-product-and-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          image: newProductForm.imageURL,
          includeModel: false
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (newProductForm.price || newProductForm.sizes.length > 0) {
          const pricingResponse = await fetch('https://api.tiendia.app/api/products/update-pricing', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              products: [{
                id: result.product.id,
                price: newProductForm.price ? parseFloat(newProductForm.price) : undefined,
                sizes: newProductForm.sizes.length > 0 ? newProductForm.sizes : undefined
              }]
            })
          });

          if (!pricingResponse.ok) {
            console.warn('Failed to update new product pricing');
          }
        }

        if (newProductForm.name && newProductForm.name.trim() !== '') {
          const nameUpdateResponse = await fetch('https://api.tiendia.app/api/products/update', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              id: result.product.id,
              name: newProductForm.name.trim(),
            })
          });

          if (!nameUpdateResponse.ok) {
            console.warn('Failed to update product name');
          }
        }

        await fetchStoreData();
        setIsAddingProduct(false);
        setNewProductForm({ name: '', price: '', imageURL: '', sizes: [] });
        toast.success('Producto agregado correctamente');
      } else {
        throw new Error('Failed to add product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error al agregar el producto');
    }
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`https://api.tiendia.app/api/products/delete/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Producto eliminado correctamente');
      } else {
        throw new Error('Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  const startEditingStore = () => {
    setIsEditingStore(true);
  };

  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      price: product.price?.toString() || '',
      imageURL: product.imageURL,
      sizes: product.sizes ? JSON.parse(product.sizes) : []
    });
  };

  const addSizeToProduct = (productIndex: number, isNewProduct: boolean = false) => {
    setAddingSizeIndex(productIndex);
    setAddingSizeValue('');
    setAddingSizeIsNew(isNewProduct);
    setTimeout(() => sizeInputRef.current && sizeInputRef.current.focus(), 100);
  };

  const handleAddSizeConfirm = () => {
    const sizeName = addingSizeValue.trim();
    if (!sizeName) return;
    const newSize: Size = { name: sizeName, stock: 0 };
    if (addingSizeIsNew) {
      setNewProductForm(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize]
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize]
      }));
    }
    setAddingSizeIndex(null);
    setAddingSizeValue('');
  };

  const handleAddSizeCancel = () => {
    setAddingSizeIndex(null);
    setAddingSizeValue('');
  };

  const updateSize = (index: number, field: 'name' | 'stock', value: string | number, isNewProduct: boolean) => {
    if (field === 'stock') {
      value = Math.max(0, parseInt(value as string) || 0);
    }

    if (isNewProduct) {
      setNewProductForm(prev => ({
        ...prev,
        sizes: prev.sizes.map((size, i) => 
          i === index ? { ...size, [field]: value } : size
        )
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        sizes: prev.sizes.map((size, i) => 
          i === index ? { ...size, [field]: value } : size
        )
      }));
    }
  };

  const removeSize = (index: number, isNewProduct: boolean = false) => {
    if (isNewProduct) {
      setNewProductForm(prev => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index)
      }));
    } else {
      setProductForm(prev => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index)
      }));
    }
  };

  const copyStoreLink = () => {
    if (store?.username) {
      const link = `https://my.tiendia.app/u/${store.username}`;
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setLogoEditMode(true);
    }
  };

  const handleSaveLogo = async () => {
    if (!newLogoPreview) return;
    setStoreForm(prev => ({ ...prev, imageUrl: newLogoPreview }));
    setLogoEditMode(false);
    setNewLogoPreview(null);
    try {
      const response = await fetch('https://api.tiendia.app/api/auth/mi-tiendia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          storeName: storeForm.name,
          storeLogo: newLogoPreview,
          phoneNumber: storeForm.countryCode + ' ' + storeForm.phone,
          countryCode: storeForm.countryCode
        })
      });
      if (response.ok) {
        setStore(prev => prev ? { ...prev, imageUrl: newLogoPreview } : prev);
        toast.success('Logo actualizado');
      } else {
        toast.error('Error al actualizar el logo');
      }
    } catch (e) {
      toast.error('Error al actualizar el logo');
    }
  };

  const handleCancelLogo = () => {
    setLogoEditMode(false);
    setNewLogoPreview(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative h-16 w-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-purple-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-50 animate-pulse"></div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Cargando tienda...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No tienes una tienda configurada</h1>
          <p className="text-gray-600 dark:text-gray-300">Configura tu tienda para comenzar a vender</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 md:pt-6 md:pl-72 pt-16">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="relative group">
                    <div
                      className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg flex items-center justify-center transition-all duration-300"
                      style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)' }}
                    >
                      <img
                        src={newLogoPreview || store.imageUrl || ''}
                        alt={store.name}
                        className="w-full h-full object-cover object-center transition-all duration-300"
                      />
                      <button
                        type="button"
                        className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700 transition-opacity duration-200"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        tabIndex={-1}
                        aria-label="Editar logo"
                      >
                        <Edit className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleLogoFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{store.name}</h1>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">Panel de administración</p>
                  </div>
                </div>
                {logoEditMode && (
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleSaveLogo}
                      className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-full font-medium shadow transition-all duration-200"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelLogo}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full font-medium shadow transition-all duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <button
                  onClick={copyStoreLink}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 md:px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center gap-2 text-sm md:text-base"
                >
                  {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedLink ? 'Copiado' : 'Copiar enlace'}
                </button>
              </div>
            </div>
          </div>

          {
            isPaid 
            ? (
              <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
                <div className="bg-green-50 dark:bg-green-900 rounded-2xl p-4 md:p-6 shadow-sm border border-green-200 dark:border-green-700 mb-6 md:mb-8 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold text-green-800 dark:text-green-200">Cuota al día</h2>
                    {quotaDueDate && (
                      <p className="text-green-700 dark:text-green-300 text-sm mt-1">Vence el {quotaDueDate.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    )}
                  </div>
                </div>
              </div>
            )
            : 
            (
              <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
                <div className="bg-red-50 dark:bg-red-900 rounded-2xl p-4 md:p-6 shadow-sm border border-red-200 dark:border-red-700 mb-6 md:mb-8 flex flex-col md:flex-row items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h2 className="text-lg md:text-xl font-semibold text-red-800 dark:text-red-200">Cuota vencida</h2>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">Tu suscripción ha expirado. Renueva para seguir usando tu tienda virtual.</p>
                  </div>
                  <button
                    onClick={() => navigate('/pay-mi-tiendia')}
                    className="mt-3 md:mt-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm md:text-base shadow"
                  >
                    Pagar ahora
                  </button>
                </div>
              </div>
            )
          }

          <div className="max-w-6xl mx-auto px-4 py-4 md:py-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                    <Store className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Información de la tienda</h2>
                </div>
                {!isEditingStore ? (
                  <button
                    onClick={startEditingStore}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleStoreSave}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      Guardar
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingStore(false);
                        setStoreForm(store);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </button>
                  </div>
                )}
              </div>

              {isEditingStore ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2 mb-4">
                    <div className="relative group">
                      <div
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 shadow-lg flex items-center justify-center transition-all duration-300"
                        style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.07)' }}
                      >
                        <img
                          src={newLogoPreview || storeForm.imageUrl || ''}
                          alt={storeForm.name}
                          className="w-full h-full object-cover object-center transition-all duration-300"
                        />
                        <button
                          type="button"
                          className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow-md border border-gray-200 dark:border-gray-700 transition-opacity duration-200"
                          onClick={() => fileInputRef.current && fileInputRef.current.click()}
                          tabIndex={-1}
                          aria-label="Editar logo"
                        >
                          <Edit className="h-4 w-4 text-gray-700 dark:text-gray-200" />
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleLogoFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>
                    {logoEditMode && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveLogo}
                          className="bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-full font-medium shadow transition-all duration-200"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelLogo}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-full font-medium shadow transition-all duration-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre de la tienda</label>
                    <input
                      type="text"
                      value={storeForm.name}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Teléfono</label>
                    <input
                      type="text"
                      value={storeForm.phone}
                      onChange={(e) => setStoreForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">{store.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm md:text-base text-gray-700 dark:text-gray-300">{products.length} productos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm md:text-base text-gray-700 dark:text-gray-300 break-all">Enlace público: my.tiendia.app/u/{store.username}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                    <Package className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">Productos</h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 md:p-4 border border-gray-200 dark:border-gray-600"
                  >
                    {editingProductId === product.id ? (
                      <div className="space-y-3 md:space-y-4">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                          <img
                            src={product.imageURL}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre</label>
                          <input
                            type="text"
                            value={productForm.name}
                            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio (ARS)</label>
                          <input
                            type="number"
                            value={productForm.price}
                            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                              Talles y stock
                            </label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSizeToProduct(editingProductId, false)}
                              className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Agregar Talle
                            </Button>
                          </div>
                          {productForm.sizes.length === 0 ? (
                            <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                                No hay talles configurados
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Agrega talles para gestionar el stock
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {productForm.sizes.map((size, index) => (
                                <div key={index} className="group relative p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 shadow-sm hover:shadow-md">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Talle
                                      </label>
                                      <Input
                                        type="text"
                                        value={size.name}
                                        onChange={(e) => updateSize(index, 'name', e.target.value, false)}
                                        placeholder="Ej: S, M, L, 31, 32..."
                                        className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80"
                                      />
                                    </div>
                                    <div className="w-24">
                                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Stock
                                      </label>
                                      <Input
                                        type="number"
                                        value={size.stock}
                                        onChange={(e) => updateSize(index, 'stock', e.target.value, false)}
                                        placeholder="0"
                                        min="0"
                                        className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 text-center"
                                      />
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeSize(index, false)}
                                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {productForm.sizes.length > 0 && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-sm mt-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                                    Stock Total
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {productForm.sizes.length} talle{productForm.sizes.length !== 1 ? 's' : ''} configurado{productForm.sizes.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                                    {productForm.sizes.reduce((total, size) => total + size.stock, 0)}
                                  </p>
                                  <p className="text-xs text-blue-600 dark:text-blue-400">
                                    unidades
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProductSave(product.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                          >
                            <Save className="h-4 w-4" />
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingProductId(null);
                              const currentProduct = products.find(p => p.id === editingProductId);
                              if (currentProduct) {
                                setProductForm({
                                  name: currentProduct.name,
                                  price: currentProduct.price?.toString() || '',
                                  imageURL: currentProduct.imageURL,
                                  sizes: currentProduct.sizes ? JSON.parse(currentProduct.sizes) : []
                                });
                              }
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 text-sm"
                          >
                            <X className="h-4 w-4" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                          <img
                            src={product.imageURL}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base md:text-lg leading-tight">
                            {product.name}
                          </h3>
                          
                          {product.price && product.price > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          )}

                          {product.sizes && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Talles y stock:</h4>
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(product.sizes).map((size: any, index: number) => (
                                  <span 
                                    key={index} 
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-xs rounded-lg text-gray-600 dark:text-gray-300"
                                  >
                                    {size.name}: {size.stock}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditingProduct(product)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
                          >
                            <Edit className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id)}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg font-medium transition-colors duration-200 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {products.length === 0 && !isAddingProduct && (
                <div className="text-center py-12 md:py-16">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-6 w-6 md:h-8 md:w-8 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No hay productos
                  </h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4">
                    Agrega tu primer producto para comenzar a vender
                  </p>
                  <button
                    onClick={() => setIsAddingProduct(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2 mx-auto text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar producto
                  </button>
                </div>
              )}

              {isAddingProduct && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 md:p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white">Nuevo producto</h3>
                    <button
                      onClick={() => {
                        setIsAddingProduct(false);
                        setNewProductForm({ name: '', price: '', imageURL: '', sizes: [] });
                      }}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre (opcional)</label>
                      <input
                        type="text"
                        value={newProductForm.name}
                        onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="Dejar vacío para generar automáticamente"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio (ARS)</label>
                      <input
                        type="number"
                        value={newProductForm.price}
                        onChange={(e) => setNewProductForm(prev => ({ ...prev, price: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Talles y Stock
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSizeToProduct(0, true)}
                        className="h-8 px-3 text-xs bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar Talle
                      </Button>
                    </div>
                    {newProductForm.sizes.length === 0 ? (
                      <div className="text-center py-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-1">
                          No hay talles configurados
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          Agrega talles para gestionar el stock
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {newProductForm.sizes.map((size, index) => (
                          <div key={index} className="group relative p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-indigo-900/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 shadow-sm hover:shadow-md">
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Talle
                                </label>
                                <Input
                                  type="text"
                                  value={size.name}
                                  onChange={e => {
                                    const value = e.target.value;
                                    setNewProductForm(prev => ({
                                      ...prev,
                                      sizes: prev.sizes.map((s, i) => i === index ? { ...s, name: value } : s)
                                    }));
                                  }}
                                  placeholder="Ej: S, M, L, 31, 32..."
                                  className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80"
                                />
                              </div>
                              <div className="w-24">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Stock
                                </label>
                                <Input
                                  type="number"
                                  value={size.stock}
                                  onChange={e => updateSize(index, 'stock', e.target.value, true)}
                                  placeholder="0"
                                  min="0"
                                  className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80 text-center"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSize(index, true)}
                                className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {addingSizeIsNew && addingSizeIndex === 0 && (
                      <div className="group relative p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700/50 dark:to-indigo-900/50 rounded-2xl border border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-200 shadow-sm hover:shadow-md mt-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Talle
                            </label>
                            <Input
                              ref={sizeInputRef}
                              type="text"
                              value={addingSizeValue}
                              onChange={e => setAddingSizeValue(e.target.value)}
                              placeholder="Nombre del talle (ej: M, 38, Niño)"
                              className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-400/20 transition-all duration-200 bg-white/80 dark:bg-gray-700/80"
                              onKeyDown={e => { if (e.key === 'Enter') handleAddSizeConfirm(); if (e.key === 'Escape') handleAddSizeCancel(); }}
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                              Stock
                            </label>
                            <Input
                              type="number"
                              value={0}
                              disabled
                              className="h-9 text-sm border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800 text-center"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleAddSizeCancel}
                            className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddSizeConfirm}
                            className="h-9 px-3 text-xs ml-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-700 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 transition-all duration-200"
                            disabled={!addingSizeValue.trim()}
                          >
                            Agregar
                          </Button>
                        </div>
                      </div>
                    )}
                    {newProductForm.sizes.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-700 shadow-sm mt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">
                              Stock Total
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {newProductForm.sizes.length} talle{newProductForm.sizes.length !== 1 ? 's' : ''} configurado{newProductForm.sizes.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">
                              {newProductForm.sizes.reduce((total, size) => total + size.stock, 0)}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              unidades
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddProduct}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                    >
                      Agregar producto
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingProduct(false);
                        setNewProductForm({ name: '', price: '', imageURL: '', sizes: [] });
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 md:px-4 py-2 rounded-lg font-medium transition-colors duration-200 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MiTiendiaAdmin;