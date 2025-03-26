import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useOrder } from "@/context/OrderContext";
import toast from "react-hot-toast";
import { MdOutlineShoppingCart } from "react-icons/md";
import { Textarea } from "./ui/textarea";
import { useState } from "react";
import { Card } from "./ui/card";
import { AspectRatio } from "./ui/aspect-ratio";
import { Button } from "./ui/button";
import { Heart, ShoppingCart } from "lucide-react";
import { Label } from "./ui/label";

interface Size {
  size: string;
  stock: number;
}

interface Product {
  id: number;
  imageURL: string | null;
  name: string;
  description: string;
  price: number;
  sizes?: Size[];
}

export default function ProductCard({ product, disabled }: { product: Product, disabled: boolean }) {
  const { addToOrder } = useOrder()!;
  const [comment, setComment] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  console.log(product)
  const handleAddToCart = () => {
    if (product.sizes?.length && !selectedSize) {
      toast.error('Por favor selecciona un talle');
      return;
    }
    
    addToOrder({
      ...product,
      comment,
      size: selectedSize,
      createdAt: new Date(),
      createdBy: 0,
    });
    
    setComment('');
    setSelectedSize(null);
    toast.success('Producto añadido al carrito');
  };

  return (
    <Drawer>
      <DrawerTrigger asChild disabled={disabled}>
        <Card className={`group relative overflow-hidden transition-all hover:shadow-lg h-full ${disabled ? 'opacity-50 cursor-not-allowed hover:shadow-none' : ''}`}>
          <div className="w-full border-b bg-muted/50">
            <AspectRatio ratio={4/3} className="bg-gradient-to-br from-muted/20 to-muted/50">
              {product.imageURL ? (
                <img
                  src={'http://localhost:3000'+product.imageURL}
                  alt={product.name}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/50">
                  <span className="text-sm">Sin imagen</span>
                </div>
              )}
            </AspectRatio>
          </div>

          <div className="p-4 flex flex-col justify-between h-[180px]">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold truncate">{product.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {product.description}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-muted-foreground">ARS</span>
                <p className="text-xl font-bold text-primary">
                  ${product.price}
                </p>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  disabled={disabled}
                  variant="outline"
                  size="sm"
                  className="rounded-full h-9 w-9 p-0"
                >
                  <Heart className="h-4 w-4" />
                </Button>
                <Button
                  disabled={disabled}
                  size="sm"
                  className="rounded-full w-full"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Añadir
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle data-view-transition-name={`product-title-${product.id}`}>
              {product.name}
            </DrawerTitle>
            <DrawerDescription>{product.description}</DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 space-y-4">
            {product.imageURL && (
              <img
                src={'http://localhost:3000'+product.imageURL}
                alt={`Product ${product.name}`}
                className="w-full h-48 object-cover rounded-lg"
                data-view-transition-name={`product-image-${product.id}`}
              />
            )}
            
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2">
                <Label>Talles disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    size.stock != 0 && 
                    <Button
                      key={size.size}
                      variant={selectedSize === size.size ? "default" : "outline"}
                      size="sm"
                      className="rounded-full"
                      onClick={() => setSelectedSize(size.size)}
                    >
                      {size.size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-gray-900">
                ${product.price}
              </span>
            </div>

            <Textarea  
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Añade un comentario (ej: sin cebolla)"
            />
          </div>

          <DrawerFooter>
            <DrawerClose>
              <Button
                disabled={disabled}
                onClick={handleAddToCart}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
              >
                Añadir al Carrito <MdOutlineShoppingCart className="text-xl ml-2"/>
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}