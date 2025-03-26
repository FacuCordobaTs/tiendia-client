import { createContext, useContext, useState, ReactNode } from "react";

interface Size {
  size: string;
  stock: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  imageURL: string | null;
  createdAt: Date;
  sizes?: Size[];
  createdBy: number;
}

interface ProductContextType {
  products: Product[];
  getProduct: (id: number) => Promise<Product | null>;
  getProducts: (username: string) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProduct must be used within a ProductProvider");
  return context;
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const url =  'http://localhost:3000/api';
  
  const getProducts = async (username: string) => {
    try {
      const response = await fetch(url+'/products/list/'+username);
      const data = await response.json();
      if (data.products.length > 1) 
        setProducts(data.products.map((p: any) => ({
          ...p
        })));
      else setProducts(data.products)
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const getProduct = async (id: number): Promise<Product | null> => {
    try {
      const response = await fetch(url+`/products/get/${id}`);
      const data = await response.json();
      return data.product ? { 
        ...data.product, 
        createdAt: new Date(data.product.createdAt) 
      } : null;
    } catch (error) {
      console.error("Error fetching product:", error);
      return null;
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      getProducts,
      getProduct
    }}>
      {children}
    </ProductContext.Provider>
  );
};