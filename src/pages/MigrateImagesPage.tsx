import React, { useState } from 'react';

import { Button } from '@/components/ui/button'; // Asumiendo que usas Shadcn UI

const MigrateImagesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const { token } = useAuth(); // El token no se usa directamente con fetch y credentials: 'include'

  const handleMigrateClick = async () => {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('https://api.tiendia.app/api/products/migrate-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Si necesitaras enviar un token Bearer explícitamente:
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({}), // Aunque el cuerpo esté vacío, es buena práctica enviarlo para POST
        credentials: 'include', // Importante para enviar cookies
      });

      const data = await response.json();

      if (!response.ok) {
        // Si la respuesta no es OK (ej. 4xx, 5xx), lanza un error con el mensaje del backend
        throw new Error(data.message || data.error || `Error ${response.status}`);
      }

      setMessage(data.message || 'Migración iniciada con éxito.');
      console.log('Respuesta de migración:', data);

    } catch (err: any) {
      console.error('Error al iniciar la migración:', err);
      // Muestra el mensaje de error capturado o uno genérico
      setError(err.message || 'Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Migrar Imágenes a R2</h1>
      <p className="mb-4">
        Haz clic en el botón de abajo para iniciar el proceso de migración de las imágenes de productos
        almacenadas localmente hacia el almacenamiento en la nube (Cloudflare R2).
        Este proceso puede tardar unos minutos dependiendo de la cantidad de imágenes.
      </p>
      <Button onClick={handleMigrateClick} disabled={isLoading}>
        {isLoading ? 'Migrando...' : 'Iniciar Migración de Imágenes'}
      </Button>
      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">Error: {error}</p>}
    </div>
  );
};

export default MigrateImagesPage;