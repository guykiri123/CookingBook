import { useState, useEffect } from 'react';
import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import RecipePage from './pages/RecipePage';
import FavoritesPage from './pages/FavoritesPage';
import AddRecipePage from './pages/AddRecipePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import UserRecipesPage from './pages/UserRecipesPage';
import { useAuth } from './context/authContext';

function App() {
  const { isLoggedIn, user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [editRecipeId, setEditRecipeId] = useState(null);
  const [viewUserRecipesId, setViewUserRecipesId] = useState(null);
  const [viewUserRecipesUsername, setViewUserRecipesUsername] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleSelectRecipe = (recipeId) => {
    setSelectedRecipeId(recipeId);
    setCurrentPage('recipe');
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setSelectedRecipeId(null);
    setViewUserRecipesId(null);
    setViewUserRecipesUsername(null);
  };

  const handleShowFavorites = () => {
    setCurrentPage('favorites');
  };

  const handleShowAddRecipe = () => {
    setCurrentPage('add');
  };

  const handleEditRecipe = (recipeId) => {
    setEditRecipeId(recipeId);
    setCurrentPage('edit');
  };

  const handleShowAdmin = () => {
    if (user?.role === 'admin') {
      setCurrentPage('admin');
    }
  };

  const handleShowUserRecipes = (userId, username) => {
    if (isLoggedIn) {
      setViewUserRecipesId(userId || null);
      setViewUserRecipesUsername(username || null);
      setCurrentPage('myRecipes');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-ink font-sans">טוען...</p>
      </div>
    );
  }

  let page;
  if (currentPage === 'login') {
    page = (
      <LoginPage
        onLoginSuccess={handleBackToHome}
        onSwitchToRegister={() => setCurrentPage('register')}
      />
    );
  } else if (currentPage === 'register') {
    page = (
      <RegisterPage
        onRegisterSuccess={handleBackToHome}
        onSwitchToLogin={() => setCurrentPage('login')}
      />
    );
  } else if (currentPage === 'admin') {
    page = <AdminPage onBack={handleBackToHome} onShowUserRecipes={handleShowUserRecipes} />;
  } else if (currentPage === 'myRecipes') {
    page = (
      <UserRecipesPage
        onBack={handleBackToHome}
        onEdit={handleEditRecipe}
        onSelectRecipe={handleSelectRecipe}
        viewUserId={viewUserRecipesId}
        viewUsername={viewUserRecipesUsername}
      />
    );
  } else if (currentPage === 'home') {
    page = <HomePage onSelectRecipe={handleSelectRecipe} />;
  } else if (currentPage === 'favorites') {
    page = <FavoritesPage onSelectRecipe={handleSelectRecipe} onBrowse={handleBackToHome} />;
  } else if (currentPage === 'add') {
    page = <AddRecipePage onCreated={handleSelectRecipe} onCancel={handleBackToHome} />;
  } else if (currentPage === 'edit') {
    page = (
      <AddRecipePage
        editId={editRecipeId}
        onCreated={handleSelectRecipe}
        onCancel={() => handleSelectRecipe(editRecipeId)}
      />
    );
  } else {
    page = (
      <RecipePage
        recipeId={selectedRecipeId}
        onBack={handleBackToHome}
        onEdit={handleEditRecipe}
      />
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <NavBar
        onLogoClick={handleBackToHome}
        onShowFavorites={handleShowFavorites}
        onShowAddRecipe={handleShowAddRecipe}
        onShowLogin={() => setCurrentPage('login')}
        onShowAdmin={handleShowAdmin}
        onShowUserRecipes={handleShowUserRecipes}
        isLoggedIn={isLoggedIn}
        user={user}
      />
      <main key={currentPage} className="animate-page-enter">{page}</main>
    </div>
  );
}

export default App;
