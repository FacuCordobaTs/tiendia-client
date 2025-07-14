import { Route, Routes } from "react-router"
import { Toaster } from 'react-hot-toast';
import { ProductProvider } from "./context/ProductContext";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import AuthProvider from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Home from "./pages/Home";
import PrivateRoute from "./components/PrivateRoute";
import GeneratedImagesPage from "./pages/GeneratedImages";
import CreditsPage from "./pages/CreditsPage";
import SettingsPage from "./pages/SettingsPage";
import AutoChargePage from "./pages/AutoChargePage"; // Importar la nueva página
import MiTiendiaForm from "./pages/MiTiendiaForm"; // Importar la nueva página de Mi Tiendia
import ProductPricingPage from "./pages/ProductPricingPage"; // Importar la nueva página de precios
import PayMiTiendia from "./pages/PayMiTiendia";
import PublicStore from "./pages/PublicStore"; // Importar la nueva página de tienda pública
import MiTiendiaAdmin from "./pages/MiTiendiaAdmin"; // Importar la nueva página de administración de Mi Tiendia
import PayMiTiendia3 from "./pages/PayMiTiendia3";

function App() {

  return (
    <>
      <Toaster/>
      <AuthProvider> 
          <ProductProvider>
              <Routes>
                <Route path="/" element={<LandingPage/>} />
                <Route path='/register' element={<RegisterPage/>} />
                <Route path='/login' element={<LoginPage/>} />
                <Route path="/home" element={
                  <PrivateRoute>
                    <Home/>
                  </PrivateRoute>
                } />
                <Route path="/credits" element={
                  <PrivateRoute>
                    <CreditsPage/>
                  </PrivateRoute>
                } />
                <Route path="/images" element={
                  <PrivateRoute>
                    <GeneratedImagesPage/>
                  </PrivateRoute>
                } />
                <Route path="/settings" element={
                  <PrivateRoute>
                    <SettingsPage/>
                  </PrivateRoute>
                } />
                <Route path="/auto-charge" element={ // Añadir la nueva ruta
                  <PrivateRoute>
                    <AutoChargePage />
                  </PrivateRoute>
                } />
                <Route path="/mi-tiendia" element={ // Añadir la nueva ruta de Mi Tiendia
                  <PrivateRoute>
                    <MiTiendiaForm />
                  </PrivateRoute>
                } />
                <Route path="/mi-tiendia-admin" element={ // Añadir la nueva ruta de administración de Mi Tiendia
                  <PrivateRoute>
                    <MiTiendiaAdmin />
                  </PrivateRoute>
                } />
                <Route path="/product-pricing" element={ // Añadir la nueva ruta de precios
                  <PrivateRoute>
                    <ProductPricingPage />
                  </PrivateRoute>
                } />
                <Route path="/pay-mi-tiendia" element={ // Añadir la nueva ruta de precios
                  <PrivateRoute>
                    <PayMiTiendia />
                  </PrivateRoute>
                } />
                <Route path="/u/:username" element={<PublicStore />} /> {/* Ruta pública para tiendas */}
                <Route path="/pay-mi-tiendia-3" element={ // Añadir la nueva ruta de precios
                  <PrivateRoute>
                    <PayMiTiendia3 />
                  </PrivateRoute>
                } />
              </Routes>
          </ProductProvider>
      </AuthProvider>
    </>
  )
}

export default App
