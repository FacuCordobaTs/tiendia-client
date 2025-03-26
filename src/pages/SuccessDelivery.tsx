import { motion } from 'framer-motion';
import { MdLocalShipping, MdCheckCircle } from 'react-icons/md';
import { Link } from 'react-router';

export default function SuccessDelivery() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-green-50 flex flex-col items-center justify-center p-4 text-center"
    >
      <div className="max-w-md w-full space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center"
        >
          <MdCheckCircle className="text-green-600 w-24 h-24" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-3xl font-bold text-green-800 mb-4 flex items-center justify-center gap-2">
            <MdLocalShipping className="w-8 h-8" />
            ¡Pedido Confirmado!
          </h1>
          
          <p className="text-lg text-green-700 mb-6">
            Tu pedido está siendo preparado con ingredientes frescos. 
            Llegará a tu dirección en aproximadamente 30-40 minutos.
          </p>
          
          <div className="bg-green-100 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              ¿Necesitas ayuda? Llama al <strong>099 123 456</strong>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
          >
            Volver al Inicio
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}