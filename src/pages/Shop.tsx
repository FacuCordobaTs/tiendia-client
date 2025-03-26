import { useEffect, useState } from 'react';
import { MdOutlineShoppingCart } from "react-icons/md";
import { FiAlertTriangle, FiClock } from "react-icons/fi";
import { useProduct } from '@/context/ProductContext';
import { useOrder } from '@/context/OrderContext';
import ProductCard from '../components/ProductCard';
import ProductCartCard from '../components/ProductCartCard';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router';
import { useShop } from '@/context/ShopContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';

const formSchema = z.object({
  deliveryType: z.enum(['delivery', 'pickup'], {
    required_error: "Debes seleccionar un tipo de entrega",
  }),
  address: z.string().optional(),
  phone: z.string()
    .min(9, "El teléfono debe tener al menos 9 dígitos")
    .max(15, "El teléfono no puede exceder 15 dígitos"),
  paymentMethod: z.enum(['efectivo', 'mercadopago'], {
    required_error: "Debes seleccionar un método de pago",
  }),
}).superRefine((data, ctx) => {
  if (data.deliveryType === 'delivery' && !data.address) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La dirección es requerida para entrega a domicilio",
      path: ['address'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const formatBusinessHours = (businessHours: any[] | null) => {
  if (!businessHours) return "No disponible";
  return businessHours
    .filter(day => day.active)
    .map(day => {
      const timeSlots = day.timeSlots.map((slot: { start: any; end: any; }) => 
        `${slot.start} - ${slot.end}`
      ).join(', ');
      return `${day.name}: ${timeSlots}`;
    })
    .join('\n');
};

export default function Home() {
  const { shop, getShop, isLoading, isOpen, businessHours } = useShop();
  const { products, getProducts } = useProduct();
  const { order, price, addOrder } = useOrder()!;
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'form'>('cart');
  const [showClosedModal, setShowClosedModal] = useState(false);
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();

  // Determinar el tipo de pago
  const paymentType = shop?.whatsappNumber ? 'whatsapp' : (shop?.connected_mp ? 'mercadopago' : 'none');

  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch, 
    setValue 
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deliveryType: 'delivery',
      paymentMethod: 'efectivo', // Siempre efectivo por defecto
      address: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (username) {
      getProducts(username);
      getShop(username);
    }
  }, [username]);

  useEffect(() => {
    if (!isLoading && shop && !isOpen) {
      setShowClosedModal(true);
    }
  }, [isLoading, shop, isOpen]);

  const deliveryType = watch('deliveryType');

  const onSubmit = async (data: FormValues) => {
    if (!isOpen) {
      setShowClosedModal(true);
      return;
    }
    
    try {
      if (username && shop) {
        if (paymentType === 'whatsapp') {
          await addOrder({
            phone_number: Number(data.phone),
            address: data.deliveryType === 'delivery' ? data.address ?? '' : 'Retiro en local',
            deliveryType: data.deliveryType,
            paymentMethod: data.paymentMethod,
            username,
          });
          // Generar enlace de WhatsApp
          const message = encodeURIComponent(`Hola, quiero hacer un pedido: ${order.map(p => p.name).join(', ')} - Total: $${price}`);
          const whatsappLink = `https://wa.me/${shop.whatsappNumber}?text=${message}`;
          window.location.href = whatsappLink;
        } else if (paymentType === 'mercadopago') {
          const result = await addOrder({
            phone_number: Number(data.phone),
            address: data.deliveryType === 'delivery' ? data.address ?? '' : 'Retiro en local',
            deliveryType: data.deliveryType,
            paymentMethod: data.paymentMethod,
            username,
          });
          if (result === 'true') { 
            navigate(data.deliveryType === 'delivery' ? '/success/delivery' : '/success/pickup');
          } else if (result !== 'false') {
            window.location.href = result;
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-2xl font-bold text-gray-600">
        Cargando tienda...
      </div>
    </div>
  );

  if (!isLoading && !shop) return (
    <div className="w-full min-h-screen flex items-center justify-center">
      <div className="text-2xl font-bold text-gray-600">
        Tienda no encontrada
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen relative bg-gradient-to-b from-orange-50 to-white">
      {/* Modal de tienda cerrada */}
      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
              <FiClock className="text-orange-500" />
              Tienda Cerrada
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              <p className="mb-4">
                Lo sentimos, actualmente estamos fuera de nuestro horario de atención.
                Puedes revisar nuestro menú, pero no podrás realizar pedidos hasta que abramos.
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Horarios de atención:</h4>
                <pre className="text-sm whitespace-pre-line">
                  {formatBusinessHours(businessHours)}
                </pre>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setShowClosedModal(false)}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Drawer del carrito */}
      {isOpen ? (
        <Drawer>
          <DrawerTrigger className="fixed top-16 right-6 z-50">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative p-4 bg-white rounded-full shadow-xl hover:shadow-2xl transition-all"
            >
              <MdOutlineShoppingCart className="w-6 h-6 text-gray-800" />
              {order.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                >
                  {order.length}
                </motion.span>
              )}
            </motion.div>
          </DrawerTrigger>

          <DrawerContent className="max-h-[90vh] max-w-2xl mx-auto border-none shadow-2xl">
            <div className="p-6 bg-gradient-to-b from-white to-orange-50">
              <AnimatePresence mode='wait'>
                {checkoutStep === 'cart' ? (
                  <motion.div
                    key="cart"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                  >
                    <DrawerHeader>
                      <DrawerTitle className="text-3xl font-bold text-gray-800">
                        Tu Carrito 🍔
                      </DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-[40vh] pr-4">
                      {order.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-center py-12"
                        >
                          <p className="text-gray-500 text-lg">
                            Tu carrito está vacío
                          </p>
                        </motion.div>
                      ) : (
                        order.map((product) => (
                          <ProductCartCard key={product.uid} product={product} />
                        ))
                      )}
                    </ScrollArea>
                    <DrawerFooter className="px-0 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-lg">Total:</span>
                        <span className="text-2xl font-bold text-orange-600">${price}</span>
                      </div>
                      <Button
                        size="lg"
                        className="w-full h-12 text-lg bg-orange-500 hover:bg-orange-600"
                        onClick={() => setCheckoutStep('form')}
                      >
                        Continuar compra
                      </Button>
                    </DrawerFooter>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6"
                  >
                    <DrawerHeader>
                      <DrawerTitle className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        🚚 Completa tu pedido
                      </DrawerTitle>
                    </DrawerHeader>
                    <ScrollArea className="h-[70vh] pr-4">
                      <div className="space-y-6">
                        {/* Tipo de entrega */}
                        <div className="space-y-4">
                          <Label className="text-lg font-semibold">Tipo de entrega</Label>
                          <RadioGroup
                            value={deliveryType}
                            onValueChange={(value: 'delivery' | 'pickup') => {
                              setValue('deliveryType', value);
                              if (value === 'pickup') setValue('address', '');
                            }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                              <Label
                                htmlFor="delivery"
                                className="w-full flex items-center justify-center text-xl font-extrabold py-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-400 peer-data-[state=checked]:border-orange-500 transition-all"
                              >
                                🚚 <span className="font-medium">Delivery</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                              <Label
                                htmlFor="pickup"
                                className="w-full flex items-center justify-center text-xl font-extrabold py-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-400 peer-data-[state=checked]:border-orange-500 transition-all"
                              >
                                🏪 <span className="font-medium">Retiro en local</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Dirección */}
                        {deliveryType === 'delivery' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-2"
                          >
                            <Label className="text-lg font-semibold">Dirección de entrega</Label>
                            <Input
                              {...register('address')}
                              placeholder="Calle y número, departamento, referencia"
                              className="h-12 text-lg w-full"
                            />
                            {errors.address && (
                              <p className="text-red-500 font-medium">{errors.address.message}</p>
                            )}
                          </motion.div>
                        )}

                        {/* Teléfono */}
                        <div className="space-y-2">
                          <Label className="text-lg font-semibold">Teléfono de contacto</Label>
                          <Input
                            {...register('phone')}
                            placeholder="Ej: 099123456"
                            className="h-12 text-lg w-full"
                          />
                          {errors.phone && (
                            <p className="text-red-500 font-medium">{errors.phone.message}</p>
                          )}
                        </div>

                        {/* Método de pago */}
                        <div className="space-y-4">
                          <Label className="text-lg font-semibold">Método de pago</Label>
                          {paymentType === 'whatsapp' ? (
                            <div className="flex w-full items-center justify-center p-6 rounded-xl border-2 border-orange-500 bg-white">
                              <span className="text-2xl">💵</span>
                              <span className="ml-2 font-medium">Efectivo</span>
                            </div>
                          ) : (
                            <RadioGroup
                              value={watch('paymentMethod')}
                              onValueChange={(value: 'efectivo' | 'mercadopago') => setValue('paymentMethod', value)}
                              className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                              <div>
                                <RadioGroupItem value="efectivo" id="efectivo" className="peer sr-only" />
                                <Label
                                  htmlFor="efectivo"
                                  className="flex w-full items-center justify-center p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-400 peer-data-[state=checked]:border-orange-500 transition-all"
                                >
                                  <span className="text-2xl">💵</span>
                                  <span className="ml-2 font-medium">Efectivo</span>
                                </Label>
                              </div>
                              {shop?.connected_mp && (
                                <div>
                                  <RadioGroupItem value="mercadopago" id="mercadopago" className="peer sr-only" />
                                  <Label
                                    htmlFor="mercadopago"
                                    className="flex md:w-full w-[80%] items-center justify-center p-6 rounded-xl border-2 border-gray-200 bg-white hover:border-orange-400 peer-data-[state=checked]:border-orange-500 transition-all"
                                  >
                                    <img
                                      src="/mercadopago-logo.png"
                                      className="h-6 mr-2"
                                      alt="Mercado Pago"
                                    />
                                    <span className="font-medium">Mercado Pago</span>
                                  </Label>
                                </div>
                              )}
                            </RadioGroup>
                          )}
                          {errors.paymentMethod && (
                            <p className="text-red-500 font-medium">{errors.paymentMethod.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Botones del footer */}
                      <DrawerFooter className="px-0 mt-8 mb-8 md:mb-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCheckoutStep('cart')}
                            className="flex-1 text-lg"
                          >
                            Volver al carrito
                          </Button>
                          <Button
                            type="submit"
                            size="lg"
                            className="flex-1 text-lg bg-orange-500 hover:bg-orange-600"
                          >
                            {paymentType === 'whatsapp' ? 'Enviar a WhatsApp' : 'Confirmar pedido'}
                          </Button>
                        </div>
                      </DrawerFooter>
                    </ScrollArea>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <div className="fixed top-6 right-6 z-50">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowClosedModal(true)}
            className="flex items-center gap-2 p-3 bg-red-100 text-red-700 rounded-full shadow-xl hover:shadow-2xl transition-all cursor-pointer"
          >
            <FiClock className="w-5 h-5" />
            <span className="font-medium hidden sm:inline">Tienda cerrada</span>
          </motion.div>
        </div>
      )}

      {/* Resto del componente */}
      <header className="bg-white py-6">
        <div className="container mx-auto flex items-center gap-4 pl-2">
          {shop && shop.profileImageURL ? (
            <img
              src={shop.profileImageURL}
              alt={shop.shopname}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <Store className="w-16 h-16" />
          )}
          <h1 className="text-3xl font-bold">{shop?.shopname}</h1>
        </div>
      </header>

      <section id="productos" className="w-full py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-12"
          >
            Nuestros Productos
          </motion.h2>

          <div className="flex flex-col lg:flex-row gap-6 mb-12">
            {businessHours && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="w-full lg:max-w-xs"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FiClock className="h-5 w-5" /> Horarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {businessHours
                        .filter(day => day.active)
                        .map((day, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-sm font-medium">{day.name}</span>
                            <div className="text-sm text-muted-foreground">
                              {day.timeSlots.map((slot, i) => (
                                <span key={i}>
                                  {i > 0 && ", "}
                                  {slot.start} - {slot.end}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      <Badge
                        variant={isOpen ? "default" : "destructive"}
                        className="mt-4 w-full"
                      >
                        {isOpen ? 'Abierto ahora' : 'Cerrado ahora'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {!isOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1"
              >
                <Alert variant="destructive">
                  <FiAlertTriangle className="h-4 w-4" />
                  <AlertTitle>Tienda cerrada</AlertTitle>
                  <AlertDescription>
                    Actualmente estamos fuera de nuestro horario de atención. Puedes explorar 
                    nuestros productos pero no podrás realizar pedidos hasta que volvamos a abrir.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} disabled={!isOpen} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}