// src/components/Loader.jsx
import Lottie from 'lottie-react';
// Importa aquí tu archivo JSON descargado
import loadingAnimation from '../../public/loading-hanger-dark.json';

const Loader = () => {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center ">
      <div className="w-40 h-40">
        <Lottie 
          animationData={loadingAnimation} 
          loop={true} 
          autoplay={true} 
        />
      </div>
    </div>
  );
};



export default Loader;