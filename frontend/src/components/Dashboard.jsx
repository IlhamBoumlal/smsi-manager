import React from 'react';

// Composant Dashboard : Page principale après connexion, affiche un aperçu des données utilisateur
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header de page */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-slate-600 mt-2">Bienvenue sur votre tableau de bord SMSI Manager</p>
        </div>

        {/* Contenu du dashboard - à personnaliser selon les besoins */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Carte exemple */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">En construction</h3>
            <p className="text-slate-600">Cette page sera bientôt enrichie avec vos indicateurs personnalisés.</p>
          </div>
        </div>
      </div>
    </div>
  );
}