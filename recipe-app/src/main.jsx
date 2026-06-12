import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { FavoritesProvider } from './context/FavoritesContext.jsx'
import { RecipesProvider } from './context/RecipesProvider.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RecipesProvider>
        <FavoritesProvider>
          <App />
        </FavoritesProvider>
      </RecipesProvider>
    </AuthProvider>
  </StrictMode>,
)
