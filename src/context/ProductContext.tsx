import { createContext, useContext, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";

interface Product {
  id: number;
  name: string;
  imageURL: string ;
  createdAt: Date;
  createdBy: number;
}
interface ProductAndImage {
  id: number;
  name: string;
  imageURL: string ;
  createdAt: Date;
  createdBy: number;
  generatedImageUrl: string;
  imageId: number;
}

interface ProductContextType {
  products: Product[];
  getProduct: (id: number) => Promise<Product | null>;
  getProducts: () => Promise<void>;
  generateProductAndImage: (imageBase64: string, includeModel: boolean) => Promise<ProductAndImage>;
  updateProduct: (id: number, name: string, imageBase64?: string | null) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error("useProduct must be used within a ProductProvider");
  return context;
};

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const url =  'https://api.tiendia.app/api';
  const { user } = useAuth();
  
  const getProducts = async ( ) => {
    try {
      if (user) {
        const response = await fetch(url+'/products/list/'+user.id);
        const data = await response.json();
        if (data.products.length > 1) 
          setProducts(data.products.map((p: any) => ({
            ...p
          })));
        else setProducts(data.products)
      }
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

  const generateProductAndImage = async (imageBase64: string, includeModel: boolean) => {
    try {
      const response = await fetch(url+'/products/generate-product-and-image', { // Asegúrate que la ruta sea correcta
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ image: imageBase64, includeModel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al generar producto e imagen');
      }

      const result = await response.json();
      setProducts(prevProducts => [
        ...prevProducts,
        {
          id: result.product.id,
          name: result.product.name, 
          imageURL: result.product.originalImageUrl,
          createdAt: new Date(result.product.createdAt),
          createdBy: result.product.createdBy,
        }
      ]);

      return {
        id: result.product.id,
        name: result.product.name,
        imageURL: result.product.imageURL,
        createdAt: new Date(result.product.createdAt),
        createdBy: result.product.createdBy,
        generatedImageUrl: result.product.generatedImageUrl,
        imageId: result.imageId
      }

    } catch (error) {
      console.error('Error en generateProductAndImage:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  };

  const updateProduct = async (id: number, name: string, imageBase64?: string | null) => {
    try {
      const response = await fetch(url+`/products/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ id, name, imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar producto');
      }

      const updatedProduct = await response.json();
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === id ? { 
            ...product,
            name: updatedProduct.product.name,
            imageURL: updatedProduct.product.imageURL ? updatedProduct.product.imageURL : product.imageURL,
           } : product
        )
      );
    }
    catch (error) {
      console.error('Error en updateProduct:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  }

  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(url+`/products/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar producto');
      }

      setProducts(prevProducts => prevProducts.filter(product => product.id !== id));
    }
    catch (error) {
      console.error('Error en deleteProduct:', error);
      throw error; // Re-lanzar para que el componente pueda manejarlo
    }
  }

  return (
    <ProductContext.Provider value={{
      products,
      getProducts,
      getProduct,
      generateProductAndImage,
      updateProduct,
      deleteProduct,
    }}>
      {children}
    </ProductContext.Provider>
  );
};