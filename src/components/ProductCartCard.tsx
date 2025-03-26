import { ArrayOrderProduct, useOrder } from "../context/OrderContext";
import { Button } from "@/components/ui/button";

export default function ProductCartCard({
  product
}: {
  product: ArrayOrderProduct;
}) 
{
  const { deleteProduct } = useOrder()!;

  return (
    <div className="flex gap-4 items-center p-4 border-b">
      <img
        src={'http://localhost:3000'+product.imageURL || "/placeholder.jpg"}
        alt={product.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      <div className="flex-1">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-500">${product.price}</p>
        <p className="text-sm text-gray-500">{product.comment}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          deleteProduct(product.uid);
        }}
      >
        Eliminar
      </Button>
    </div>
  );
}