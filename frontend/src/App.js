
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';

function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <h1 className="text-2xl font-bold text-blue-600 mb-2">
          Bienvenue, {user?.nomComplet} 👋
        </h1>
        <p className="text-gray-500 mb-4">{user?.email}</p>
        <button
          onClick={logout}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg"
        >
          Se déconnecter
        </button>
      </div>

import React, { useState } from 'react';
import Header from './pages/Header'; // Vérifiez bien le chemin vers votre Header

function App() {
  // 1. On crée un état "activeAxe" qui vaut "tableau-bord" par défaut
  const [activeAxe, setActiveAxe] = useState("tableau-bord");

  return (
    <div>
      {/* 2. On passe l'état actuel et la fonction pour le changer au Header */}
      <Header 
        activeAxe={activeAxe} 
        onAxeChange={(id) => setActiveAxe(id)} 
        onLoginClick={() => console.log("Login")}
        onRegisterClick={() => console.log("Register")}
      />

      {/* Ici vous pouvez afficher le contenu de vos pages */}
      <main className="p-10 text-center">
        <h1 className="text-2xl font-bold">
        </h1>
      </main>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

