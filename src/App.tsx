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
              </Routes>
          </ProductProvider>
      </AuthProvider>
    </>
  )
}

export default App
