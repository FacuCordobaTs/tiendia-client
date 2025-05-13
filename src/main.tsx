import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router'
import { ProductProvider } from './context/ProductContext.tsx'
import AuthProvider from './context/AuthContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProductProvider>
          <ThemeProvider  storageKey="vite-ui-theme">
            <App />
            <Toaster position="top-center" reverseOrder={false} />
          </ThemeProvider>
        </ProductProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
