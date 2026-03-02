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

export default App;