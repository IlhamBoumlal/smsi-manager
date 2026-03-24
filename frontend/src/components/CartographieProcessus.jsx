import React, { useState } from 'react';

/* ══ DATA ════════════════════════════════════════════════════════════════════ */
const PROCESSES = {
  gouvernance: {
    title: 'Processus de gouvernance et pilotage du SMSI',
    desc:  "Assure la gouvernance globale du SMSI, définit la politique SSI et pilote le plan d'amélioration continue.",
    cat:   'Management',
    color: '#1a5f72',
  },
  risques: {
    title: 'Processus de gestion des risques et plan de traitement',
    desc:  'Identifie, évalue et traite les risques SSI. Produit le registre des risques et le plan de traitement associé.',
    cat:   'Management',
    color: '#1a5f72',
  },
  commercial: {
    title: 'Commercial / Prospection',
    desc:  "Pilote les activités commerciales, la prospection clients et le suivi des opportunités de croissance.",
    cat:   'Réalisation',
    color: '#1e6891',
  },
  developpement: {
    title: 'Réalisation / Développement applicatif',
    desc:  'Couvre le cycle complet de développement : analyse, conception, développement, tests et validation des applications.',
    cat:   'Réalisation',
    color: '#1e6891',
  },
  deploiement: {
    title: 'Déploiement / Livraison',
    desc:  "Assure le déploiement des solutions livrées, la mise en production et la livraison dans les conditions contractuelles.",
    cat:   'Réalisation',
    color: '#1e6891',
  },
  rh: {
    title: 'Gestion RH',
    desc:  'Pilote le recrutement, la formation, la gestion des compétences et le développement des collaborateurs.',
    cat:   'Support',
    color: '#1b4f80',
  },
  infra: {
    title: 'Infrastructure et Outils',
    desc:  "Administre et maintient l'infrastructure IT, les outils et les environnements de travail.",
    cat:   'Support',
    color: '#1b4f80',
  },
  secu: {
    title: 'Sécurité Information',
    desc:  'Met en œuvre les contrôles de sécurité, la politique SSI et assure la conformité ISO 27001.',
    cat:   'Support',
    color: '#1b4f80',
  },
  fournisseurs: {
    title: 'Gestion des fournisseurs',
    desc:  'Sélectionne, évalue et pilote les relations avec les prestataires et fournisseurs stratégiques.',
    cat:   'Support',
    color: '#1b4f80',
  },
  changements: {
    title: 'Gestion des changements',
    desc:  'Contrôle et coordonne tous les changements impactant les systèmes, processus et services.',
    cat:   'Support',
    color: '#1b4f80',
  },
};

/* ══ ARROW MARKER (SVG defs) ═════════════════════════════════════════════════ */
const ARROW_COLOR = '#1a6674';

function Defs() {
  return (
    <defs>
      <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M2 1L8 5L2 9" fill="none" stroke={ARROW_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </marker>
    </defs>
  );
}

/* ══ MODAL ═══════════════════════════════════════════════════════════════════ */
function Modal({ proc, onClose }) {
  if (!proc) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 99,
        background: 'rgba(0,0,0,0.42)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: 16,
          padding: '1.5rem 2rem', maxWidth: 420, width: '90%',
          border: '0.5px solid #e2e8f0',
          boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ width: 4, height: 40, borderRadius: 2, background: proc.color, flexShrink: 0, marginRight: 14, marginTop: 2 }} />
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, flex: 1, lineHeight: 1.4, color: '#0f172a' }}>{proc.title}</p>
          <button onClick={onClose} style={{ marginLeft: 12, fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>×</button>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 10px 18px', lineHeight: 1.6 }}>{proc.desc}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 0 18px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Catégorie : {proc.cat}
        </p>
      </div>
    </div>
  );
}

/* ══ MAIN ════════════════════════════════════════════════════════════════════ */
export default function CartographieProcessus() {
  const [sel, setSel] = useState(null);

  const open = (key) => setSel(PROCESSES[key]);
  const close = () => setSel(null);

  /* SVG layout constants */
  const VW = 680;
  const A = ARROW_COLOR;

  /* Inner box text style */
  const T = { fontFamily: 'ui-sans-serif,system-ui,sans-serif', fontSize: 11, fontWeight: 600 };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#f0f6fb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem 2.5rem',
      boxSizing: 'border-box',
      overflow: 'hidden',
      fontFamily: 'ui-sans-serif,system-ui,sans-serif',
    }}>
      <Modal proc={sel} onClose={close} />

      {/* Title */}
      <p style={{ fontSize: 20, fontWeight: 600, color: '#1a5f72', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem', flexShrink: 0 }}>
        Cartographie des processus
      </p>

      {/* SVG — fills all remaining height */}
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VW} 620`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', flex: 1, minHeight: 0 }}
      >
        <Defs />

        {/* ══ TOIT ══════════════════════════════════════════════════════════ */}
        <polygon points="340,16 556,120 124,120" fill="#1a5f72" />
        <text x="340" y="82" textAnchor="middle" fill="#d1eff8" dominantBaseline="central" style={{ ...T, fontSize: 15 }}>
          Processus de management
        </text>

        {/* ══ PANNEAU MANAGEMENT ════════════════════════════════════════════ */}
        <rect x="124" y="120" width="432" height="110" fill="#c8e6f0" stroke="#93c5da" strokeWidth="0.5" />

        {/* Boîte Gouvernance */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('gouvernance')}>
          <rect x="156" y="140" width="170" height="70" rx="6" fill="#1a5f72" />
          <text x="241" y="168" textAnchor="middle" fill="#d1eff8" dominantBaseline="central" style={T}>Gouvernance et</text>
          <text x="241" y="184" textAnchor="middle" fill="#d1eff8" dominantBaseline="central" style={T}>pilotage du SMSI</text>
        </g>

        {/* Flèche entre les 2 boîtes management */}
        <line x1="326" y1="175" x2="354" y2="175" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* Boîte Gestion des risques */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('risques')}>
          <rect x="354" y="140" width="170" height="70" rx="6" fill="#1a5f72" />
          <text x="439" y="164" textAnchor="middle" fill="#d1eff8" dominantBaseline="central" style={T}>Gestion des risques</text>
          <text x="439" y="180" textAnchor="middle" fill="#d1eff8" dominantBaseline="central" style={T}>et plan de traitement</text>
        </g>

        {/* ══ LIGNES FEEDBACK VERTICALES (haut) ════════════════════════════ */}
        <line x1="64" y1="175" x2="64" y2="330" stroke={A} strokeWidth="1.5" />
        <line x1="616" y1="175" x2="616" y2="330" stroke={A} strokeWidth="1.5" />

        {/* Flèches horizontales management ↔ lignes feedback */}
        <line x1="64" y1="175" x2="154" y2="175" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="526" y1="175" x2="616" y2="175" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* Flèche ↓ management → réalisation */}
        <line x1="340" y1="230" x2="340" y2="265" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* ══ BOÎTE BESOINS (gauche) ════════════════════════════════════════ */}
        <rect x="14" y="268" width="94" height="70" rx="8" fill="#2563a8" stroke="#1e4f8c" strokeWidth="0.5" />
        <text x="61" y="289" textAnchor="middle" fill="#dbeeff" dominantBaseline="central" style={{ ...T, fontSize: 11 }}>Besoins attentes</text>
        <text x="61" y="303" textAnchor="middle" fill="#dbeeff" dominantBaseline="central" style={{ ...T, fontSize: 11 }}>parties</text>
        <text x="61" y="317" textAnchor="middle" fill="#dbeeff" dominantBaseline="central" style={{ ...T, fontSize: 11 }}>intéressées</text>

        {/* Flèche ligne gauche ↔ boîte Besoins */}
        <line x1="64" y1="303" x2="14" y2="303" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" markerStart="url(#arr)" />
        {/* Flèche Besoins → réalisation */}
        <line x1="108" y1="303" x2="124" y2="303" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* ══ BOÎTE SATISFACTION (droite) ══════════════════════════════════ */}
        <rect x="572" y="268" width="94" height="70" rx="8" fill="#2563a8" stroke="#1e4f8c" strokeWidth="0.5" />
        <text x="619" y="289" textAnchor="middle" fill="#dbeeff" dominantBaseline="central" style={{ ...T, fontSize: 11 }}>Satisfaction des</text>
        <text x="619" y="303" textAnchor="middle" fill="#dbeeff" dominantBaseline="central" style={{ ...T, fontSize: 11 }}>parties</text>
        <text x="619" y="317" textAnchor="middle" fill="#dbeeff" dominantBaseline="central" style={{ ...T, fontSize: 11 }}>intéressées</text>

        {/* Flèche réalisation → boîte Satisfaction */}
        <line x1="556" y1="303" x2="572" y2="303" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />
        {/* Flèche boîte Satisfaction → ligne droite */}
        <line x1="666" y1="303" x2="616" y2="303" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* Flèches feedback remontant ↑ vers management */}
        <line x1="64" y1="268" x2="64" y2="180" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />
        <line x1="616" y1="268" x2="616" y2="180" stroke={A} strokeWidth="1.5" markerEnd="url(#arr)" />

        {/* ══ PANNEAU RÉALISATION ════════════════════════════════════════════ */}
        <rect x="124" y="265" width="432" height="130" fill="#cce2f0" stroke="#93c5da" strokeWidth="0.5" />
        <text x="340" y="285" textAnchor="middle" fill="#0d3d5c" dominantBaseline="central" style={{ ...T, fontSize: 13 }}>
          Processus de réalisation
        </text>

        {/* Commercial */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('commercial')}>
          <rect x="144" y="298" width="116" height="72" rx="6" fill="#1e6891" />
          <text x="202" y="326" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>Commercial /</text>
          <text x="202" y="342" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>Prospection</text>
        </g>

        {/* Développement */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('developpement')}>
          <rect x="282" y="298" width="116" height="72" rx="6" fill="#1e6891" />
          <text x="340" y="322" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>Réalisation /</text>
          <text x="340" y="338" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>Développement</text>
          <text x="340" y="354" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>applicatif</text>
        </g>

        {/* Déploiement */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('deploiement')}>
          <rect x="420" y="298" width="116" height="72" rx="6" fill="#1e6891" />
          <text x="478" y="326" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>Déploiement /</text>
          <text x="478" y="342" textAnchor="middle" fill="#d0eaf9" dominantBaseline="central" style={T}>Livraison</text>
        </g>

        {/* ══ 5 FLÈCHES ↑ support → réalisation ════════════════════════════ */}
        {[188, 249, 340, 431, 492].map(x => (
          <line key={x} x1={x} y1="440" x2={x} y2="397" stroke={A} strokeWidth="1.8" markerEnd="url(#arr)" />
        ))}

        {/* ══ PANNEAU SUPPORT ════════════════════════════════════════════════ */}
        <rect x="124" y="440" width="432" height="148" fill="#c9def5" stroke="#93b8da" strokeWidth="0.5" />
        <text x="340" y="462" textAnchor="middle" fill="#0d3155" dominantBaseline="central" style={{ ...T, fontSize: 13 }}>
          Processus de support
        </text>

        {/* Gestion RH */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('rh')}>
          <rect x="136" y="476" width="72" height="92" rx="6" fill="#1b4f80" />
          <text x="172" y="510" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>Gestion</text>
          <text x="172" y="526" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>RH</text>
        </g>

        {/* Infrastructure */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('infra')}>
          <rect x="220" y="476" width="72" height="92" rx="6" fill="#1b4f80" />
          <text x="256" y="506" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>Infrastructure</text>
          <text x="256" y="522" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>et Outils</text>
        </g>

        {/* Sécurité */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('secu')}>
          <rect x="304" y="476" width="72" height="92" rx="6" fill="#1b4f80" />
          <text x="340" y="506" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>Sécurité</text>
          <text x="340" y="522" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>Information</text>
        </g>

        {/* Fournisseurs */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('fournisseurs')}>
          <rect x="388" y="476" width="72" height="92" rx="6" fill="#1b4f80" />
          <text x="424" y="506" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>Gestion des</text>
          <text x="424" y="522" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>fournisseurs</text>
        </g>

        {/* Changements */}
        <g style={{ cursor: 'pointer' }} onClick={() => open('changements')}>
          <rect x="472" y="476" width="72" height="92" rx="6" fill="#1b4f80" />
          <text x="508" y="506" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>Gestion des</text>
          <text x="508" y="522" textAnchor="middle" fill="#cddff5" dominantBaseline="central" style={T}>changements</text>
        </g>

      </svg>
    </div>
  );
}