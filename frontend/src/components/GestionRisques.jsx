import React, { useState, useEffect } from 'react';
import { 
  Search, ChevronRight, LayoutDashboard, BarChart3, 
  FileText, Plus, ArrowLeft, Download, Info, ShieldCheck, 
  Building2, Users, Lock, Cpu, CheckCircle2, MoreVertical,
  Edit2, Trash2, X, Save, PlusCircle, Target, Package, AlertTriangle
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DU THÈME
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  font: "'Sora', sans-serif",
  bg: '#F8F9FB',
  white: '#ffffff',
  gray900: '#111827',
  gray700: '#374151',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray200: '#e5e7eb',
  accent: '#1D4ED8',
  gradBlue: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
  shadow: '0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
  radius: '12px',
  radiusSm: '8px',
  radiusXs: '6px',
};

// ─────────────────────────────────────────────────────────────────────────────
// DONNÉES DE SIMULATION COMPLÈTES AVEC TOUS LES CHAMPS
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_STUDY = {
  id: 1,
  titre: 'Étude de Risques',
  responsable: 'Marie Dupont',
  organisation: 'TechCorp SA',
  status: 'En cours',
  domaine: 'Technologique',
  createdAt: '2025-01-15',
  workshops: {
    1: {
      status: 'in_progress',
      generalInfo: {
        date: '2025-01-15',
        version: '1.0',
        constraints: 'Les sous-traitants accédant au SI sont couverts par des clauses contractuelles'
      },
      context: {
        description: 'TechCorp SA est une PME de 250 employés spécialisée dans les logiciels de gestion RH',
        perimeter: 'Système d\'information de gestion et infrastructure cloud',
        environment: 'Infrastructure hybride (on-premise + AWS)',
        hypotheses: 'L\'infrastructure AWS est considérée comme correctement configurée',
        constraints: 'RGPD, NIS2, exigences contractuelles client grand compte'
      },
      team: [
        { id: 'tm1', role: 'RSSI', name: 'Marie Dupont', responsibility: 'Pilotage de l\'analyse', contact: 'm.dupont@techcorp.fr' },
        { id: 'tm2', role: 'Consultant', name: 'Jean Martin', responsibility: 'Validation architecture', contact: 'j.martin@techcorp.fr' }
      ],
      missions: [
        { id: 'm1', name: 'Production logicielle', description: 'Développement et livraison des solutions SaaS' },
        { id: 'm2', name: 'Administration & Finance', description: 'Gestion comptable, RH interne' }
      ],
      businessValues: [
        { id: 'bv1', missionId: 'm1', name: 'Code source des applications', type: 'Savoir-faire', description: 'Code source des produits SaaS RH' },
        { id: 'bv2', missionId: 'm1', name: 'Données clients RH', type: 'Données personnelles', description: 'Données RH des salariés des clients' }
      ],
      supportingAssets: [
        { id: 'bs1', businessValueId: 'bv1', name: 'GitLab (dépôt de code)', type: 'Application', location: 'AWS eu-west-1', criticality: 'Critique' },
        { id: 'bs2', businessValueId: 'bv2', name: 'Base de données PostgreSQL', type: 'Base de données', location: 'AWS RDS', criticality: 'Critique' }
      ],
      fearedEvents: [
        { id: 'fe1', businessValueId: 'bv2', description: 'Exfiltration massive de données personnelles RH', impact: 'Sanctions CNIL, perte de confiance', gravity: 4 },
        { id: 'fe2', businessValueId: 'bv1', description: 'Vol du code source propriétaire', impact: 'Perte de l\'avantage concurrentiel', gravity: 4 }
      ],
      isoControls: [
        { id: 'iso1', reference: 'A.5.1', name: 'Politiques de sécurité', status: 'appliqué', comments: 'PSSI v3.2 validée' },
        { id: 'iso2', reference: 'A.8.2', name: 'Droits d\'accès privilégiés', status: 'partiel', comments: 'MFA déployé sur 80%' }
      ]
    },
    2: {
      status: 'not_started',
      riskSources: [
        { id: 'rs1', name: 'Cybercriminel organisé', type: 'Externe', motivation: 'Gain financier', capability: 3 },
        { id: 'rs2', name: 'Insider malveillant', type: 'Interne', motivation: 'Vengeance', capability: 2 }
      ],
      targetObjectives: [
        { id: 'ov1', name: 'Exfiltrer les données RH', description: 'Accéder et extraire la BDD clients', fearedEventIds: ['fe1'] },
        { id: 'ov2', name: 'Voler le code source', description: 'Accéder aux dépôts GitLab', fearedEventIds: ['fe2'] }
      ],
      sourceObjectivePairs: [
        { id: 'pr1', riskSourceId: 'rs1', targetObjectiveId: 'ov1', retained: true, justification: 'Les ransomware ciblent les données RH' }
      ]
    },
    3: {
      status: 'blocked',
      stakeholders: [],
      strategicScenarios: [],
      treatments: []
    },
    4: {
      status: 'blocked',
      operationalModes: [],
      operationalScenarios: []
    },
    5: {
      status: 'blocked',
      riskEntries: [],
      measures: [],
      residualRisks: []
    }
  }
};

const STUDIES_DATA = [DEMO_STUDY];

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function GestionRisques() {
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [activeAtelier, setActiveAtelier] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [editModal, setEditModal] = useState({ open: false, type: null, data: null });
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getWorkshopStatus = (study, num) => {
    const w = study.workshops[num];
    if (num === 1) {
      if (w.missions?.length > 0 && w.businessValues?.length > 0 && w.fearedEvents?.length > 0) return 'completed';
      if (w.team?.length || w.businessValues?.length) return 'in_progress';
      return 'not_started';
    }
    if (num === 2) {
      const prevComplete = study.workshops[1].missions?.length > 0 && study.workshops[1].businessValues?.length > 0;
      if (!prevComplete) return 'blocked';
      if (w.sourceObjectivePairs?.some(p => p.retained)) return 'completed';
      if (w.riskSources?.length) return 'in_progress';
      return 'not_started';
    }
    if (num === 3) {
      if (study.workshops[2].sourceObjectivePairs?.filter(p => p.retained).length === 0) return 'blocked';
      if (w.strategicScenarios?.length > 0) return 'completed';
      if (w.stakeholders?.length) return 'in_progress';
      return 'not_started';
    }
    if (num === 4) {
      if (study.workshops[3].strategicScenarios?.length === 0) return 'blocked';
      if (w.operationalScenarios?.length > 0) return 'completed';
      if (w.operationalModes?.length) return 'in_progress';
      return 'not_started';
    }
    if (num === 5) {
      if (study.workshops[4].operationalScenarios?.length === 0) return 'blocked';
      if (w.measures?.length > 0) return 'completed';
      if (w.riskEntries?.length) return 'in_progress';
      return 'not_started';
    }
    return 'not_started';
  };

  const statusLabels = {
    not_started: 'Non commencé',
    in_progress: 'En cours',
    completed: 'Terminé',
    blocked: 'Bloqué'
  };

  const statusColors = {
    not_started: { bg: '#F3F4F6', color: '#6B7280' },
    in_progress: { bg: '#FEF3C7', color: '#D97706' },
    completed: { bg: '#D1FAE5', color: '#10B981' },
    blocked: { bg: '#FEE2E2', color: '#DC2626' }
  };

  if (!selectedStudy) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '36px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: T.gray900, margin: '0 0 6px', letterSpacing: '-0.8px' }}>
                Administration des Risques
              </h1>
              <p style={{ fontSize: 13.5, color: T.gray500, margin: 0 }}>
                Gestion des études et des ateliers EBIOS RM
              </p>
            </div>
            <button style={btnPrimaryStyle}><Plus size={18} /> Nouvelle Étude</button>
          </div>

          <div style={{ position: 'relative', marginBottom: 24 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.gray400 }} />
            <input
              type="text" placeholder="Rechercher une étude..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={searchSubtle}
            />
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {STUDIES_DATA.filter(s => s.titre.toLowerCase().includes(searchTerm.toLowerCase())).map((study) => (
              <div key={study.id} style={studyCardStyle} onClick={() => setSelectedStudy(study)}>
                <div style={{ ...cardStrip, background: study.status === 'Terminé' ? '#10B981' : T.accent }} />
                <div style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={iconBoxStyle}><FileText size={20} color="#fff" /></div>
                    <div>
                      <div style={domaineBadgeStyle}>{study.domaine}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: T.gray900 }}>{study.titre}</div>
                      <div style={{ fontSize: 12, color: T.gray500, marginTop: 4 }}>Responsable : {study.responsable}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: T.gray400, textTransform: 'uppercase' }}>Progression</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.accent }}>65%</div>
                    </div>
                    <ChevronRight size={20} color={T.gray400} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const study = selectedStudy;
  const workshop = study.workshops[activeAtelier];
  const workshopStatus = getWorkshopStatus(study, activeAtelier);
  const statusColor = statusColors[workshopStatus];

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, padding: '36px' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <button onClick={() => setSelectedStudy(null)} style={backBtnStyle}>
          <ArrowLeft size={16} /> Retour aux études
        </button>

        {/* En-tête de l'étude */}
        <div style={studyHeaderCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: T.font, fontSize: 20, fontWeight: 800, color: '#fff' }}>{study.titre}</div>
            </div>
          </div>
        </div>

        {/* Onglets des ateliers */}
        <div style={atelierTabs}>
          {[1, 2, 3, 4, 5].map(num => {
            const st = getWorkshopStatus(study, num);
            const isBlocked = st === 'blocked';
            return (
              <button
                key={num}
                onClick={() => setActiveAtelier(num)}
                style={atelierTabStyle(activeAtelier === num, isBlocked)}
                disabled={isBlocked}
              >
                <span style={tabNumStyle}>{num}</span>
                <span>Atelier {num}</span>
                {st === 'completed' && <span style={{ color: '#10B981', marginLeft: 6 }}>✓</span>}
                {st === 'in_progress' && <span style={progressDot} />}
                {isBlocked && <span style={{ fontSize: 12, marginLeft: 6 }}>🔒</span>}
              </button>
            );
          })}
        </div>

        {/* En-tête de l'atelier */}
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: T.accent, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Atelier {activeAtelier}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: T.gray900, margin: '4px 0 8px' }}>
              {getAtelierTitle(activeAtelier)}
            </h2>
            <p style={{ fontSize: 14, color: T.gray500, maxWidth: 700 }}>
              {getAtelierDesc(activeAtelier)}
            </p>
          </div>
          <div style={{ ...statusPill, background: statusColor.bg, color: statusColor.color }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor.color, display: 'inline-block', marginRight: 6 }} />
            {statusLabels[workshopStatus]}
          </div>
        </div>

        {/* Contenu de l'atelier */}
        <div style={mainAtelierCard}>
          {activeAtelier === 1 && <Atelier1Content study={study} openSections={openSections} toggleSection={toggleSection} setEditModal={setEditModal} />}
          {activeAtelier === 2 && <Atelier2Content study={study} openSections={openSections} toggleSection={toggleSection} setEditModal={setEditModal} />}
          {activeAtelier === 3 && <Atelier3Content study={study} openSections={openSections} toggleSection={toggleSection} setEditModal={setEditModal} />}
          {activeAtelier === 4 && <Atelier4Content study={study} openSections={openSections} toggleSection={toggleSection} setEditModal={setEditModal} />}
          {activeAtelier === 5 && <Atelier5Content study={study} openSections={openSections} toggleSection={toggleSection} setEditModal={setEditModal} />}
        </div>
      </div>

      {/* Modal d'édition */}
      {editModal.open && (
        <EditModal editModal={editModal} setEditModal={setEditModal} study={study} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATELIER 1 : CADRAGE ET SOCLE DE SÉCURITÉ
// ─────────────────────────────────────────────────────────────────────────────
function Atelier1Content({ study, openSections, toggleSection, setEditModal }) {
  const w = study.workshops[1];

  const renderSection = (key, num, title, badge, body, icon, defaultOpen = true) => {
    const isOpen = openSections[key] !== undefined ? openSections[key] : defaultOpen;
    return React.createElement('div', { key: key, style: sectionCard },
      React.createElement('div', { 
        style: { ...sectionHeader, ...(isOpen && sectionHeaderOpen) }, 
        onClick: () => toggleSection(key) 
      },
        React.createElement('div', { style: sectionHeaderTitle },
          React.createElement('span', { style: sectionNumBadge }, num),
          icon && React.createElement(icon, { size: 16, style: { marginRight: 8, color: T.accent } }),
          React.createElement('span', null, title),
          badge && React.createElement('span', { style: countBadge }, badge)
        ),
        React.createElement('span', { style: { ...chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' } }, '›')
      ),
      React.createElement('div', { style: { display: isOpen ? 'block' : 'none' } },
        React.createElement('div', { style: sectionBody }, body)
      )
    );
  };

  return React.createElement('div', null,
    renderSection('w1_info', 1, 'Informations générales', null,
      React.createElement('div', { style: formGrid },
        React.createElement('div', { style: formGroup },
          React.createElement('label', { style: formLabel }, 'Date'),
          React.createElement('input', { style: formInput, type: 'date', defaultValue: w.generalInfo.date })
        ),
        React.createElement('div', { style: formGroup },
          React.createElement('label', { style: formLabel }, 'Version'),
          React.createElement('input', { style: formInput, defaultValue: w.generalInfo.version })
        ),
        React.createElement('div', { style: { ...formGroup, gridColumn: '1/-1' } },
          React.createElement('label', { style: formLabel }, 'Hypothèses / Contraintes'),
          React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: w.generalInfo.constraints })
        )
      ), Info
    ),
    renderSection('w1_ctx', 2, 'Contexte de l\'étude', null,
      React.createElement('div', null,
        React.createElement('div', { style: helpTip }, 'ℹ️ Le contexte est la fondation. Décrivez périmètre, environnement et enjeux.'),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          React.createElement('div', { style: formGroup },
            React.createElement('label', { style: formLabel }, 'Description'),
            React.createElement('textarea', { style: formTextarea, rows: 3, defaultValue: w.context.description })
          ),
          React.createElement('div', { style: formGroup },
            React.createElement('label', { style: formLabel }, 'Périmètre'),
            React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: w.context.perimeter })
          ),
          React.createElement('div', { style: formGroup },
            React.createElement('label', { style: formLabel }, 'Environnement'),
            React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: w.context.environment })
          )
        )
      ), FileText
    ),
    renderSection('w1_team', 3, 'Équipe et responsabilités', w.team.length,
      React.createElement('div', null,
        React.createElement('button', { style: btnSmallPrimary, onClick: () => setEditModal({ open: true, type: 'team', data: null }) }, '+ Ajouter un membre'),
        w.team.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Rôle'),
                React.createElement('th', null, 'Nom'),
                React.createElement('th', null, 'Responsabilité'),
                React.createElement('th', null, 'Contact'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.team.map(m => React.createElement('tr', { key: m.id },
                React.createElement('td', null, escapeHtml(m.role)),
                React.createElement('td', null, React.createElement('strong', null, escapeHtml(m.name))),
                React.createElement('td', null, escapeHtml(m.responsibility)),
                React.createElement('td', null, escapeHtml(m.contact || '—')),
                React.createElement('td', null,
                  React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'team', data: m }) }, '✏️')
                )
              ))
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun membre défini.')
      ), Users
    ),
    renderSection('w1_bv', 4, 'Missions & Valeurs métier', w.businessValues.length,
      React.createElement('div', null,
        React.createElement('div', { style: helpTip }, 'ℹ️ Créez d\'abord des missions, puis associez-y des valeurs métier.'),
        React.createElement('div', { style: { marginBottom: 16 } },
          React.createElement('div', { style: { fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 8 } }, 'Missions'),
          React.createElement('div', { style: { display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' } },
            React.createElement('input', { style: formInput, placeholder: 'Nom de la mission' }),
            React.createElement('button', { style: btnSmallPrimary }, '+ Ajouter')
          ),
          React.createElement('div', { style: chips },
            w.missions.map(m => React.createElement('span', { key: m.id, style: missionChip },
              escapeHtml(m.name),
              React.createElement('button', { style: chipRemove }, '×')
            ))
          )
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 12, fontWeight: 600, color: T.gray500, marginBottom: 8 } }, 'Valeurs métier'),
          React.createElement('button', { style: btnSmallPrimary, disabled: !w.missions.length }, '+ Ajouter une valeur métier'),
          w.businessValues.length ? React.createElement('div', { style: tableWrap },
            React.createElement('table', { style: table },
              React.createElement('thead', null,
                React.createElement('tr', null,
                  React.createElement('th', null, 'Mission'),
                  React.createElement('th', null, 'Nom'),
                  React.createElement('th', null, 'Type'),
                  React.createElement('th', null, 'Description'),
                  React.createElement('th', null)
                )
              ),
              React.createElement('tbody', null,
                w.businessValues.map(v => {
                  const m = w.missions.find(x => x.id === v.missionId);
                  return React.createElement('tr', { key: v.id },
                    React.createElement('td', null, escapeHtml(m?.name || '—')),
                    React.createElement('td', null, React.createElement('strong', null, escapeHtml(v.name))),
                    React.createElement('td', null, escapeHtml(v.type || '—')),
                    React.createElement('td', null, escapeHtml(v.description || '—')),
                    React.createElement('td', null,
                      React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'businessValue', data: v }) }, '✏️')
                    )
                  );
                })
              )
            )
          ) : React.createElement('p', { style: emptyText }, 'Aucune valeur métier — créez d\'abord une mission.')
        )
      ), Target
    ),
    renderSection('w1_bs', 5, 'Biens supports', w.supportingAssets.length,
      React.createElement('div', null,
        !w.businessValues.length && React.createElement('div', { style: blockedAlert }, 'Valeurs métier requises'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.businessValues.length }, '+ Ajouter un bien support'),
        w.supportingAssets.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Valeur métier'),
                React.createElement('th', null, 'Nom'),
                React.createElement('th', null, 'Type'),
                React.createElement('th', null, 'Localisation'),
                React.createElement('th', null, 'Criticité'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.supportingAssets.map(a => {
                const v = w.businessValues.find(x => x.id === a.businessValueId);
                const critCls = { Critique: 'lvl-4', Élevée: 'lvl-3', Moyenne: 'lvl-2', Faible: 'lvl-1' }[a.criticality];
                return React.createElement('tr', { key: a.id },
                  React.createElement('td', null, escapeHtml(v?.name || '—')),
                  React.createElement('td', null, React.createElement('strong', null, escapeHtml(a.name))),
                  React.createElement('td', null, escapeHtml(a.type || '—')),
                  React.createElement('td', null, escapeHtml(a.location || '—')),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(critCls) }, escapeHtml(a.criticality))),
                  React.createElement('td', null,
                    React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'supportingAsset', data: a }) }, '✏️')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun bien support.')
      ), Package
    ),
    renderSection('w1_er', 6, 'Événements redoutés', w.fearedEvents.length,
      React.createElement('div', null,
        !w.businessValues.length && React.createElement('div', { style: blockedAlert }, 'Valeurs métier requises'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.businessValues.length }, '+ Ajouter un événement redouté'),
        w.fearedEvents.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Valeur métier'),
                React.createElement('th', null, 'Description'),
                React.createElement('th', null, 'Impact'),
                React.createElement('th', null, 'Gravité'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.fearedEvents.map(e => {
                const v = w.businessValues.find(x => x.id === e.businessValueId);
                return React.createElement('tr', { key: e.id },
                  React.createElement('td', null, escapeHtml(v?.name || '—')),
                  React.createElement('td', null, escapeHtml(e.description)),
                  React.createElement('td', null, escapeHtml(e.impact || '—')),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${e.gravity}`) }, `G${e.gravity}`)),
                  React.createElement('td', null,
                    React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'fearedEvent', data: e }) }, '✏️')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun événement redouté.')
      ), AlertTriangle
    ),
    renderSection('w1_iso', 7, 'Contrôles ISO 27001:2022', w.isoControls.length,
      React.createElement('div', null,
        React.createElement('div', { style: helpTip }, 'ℹ️ Les contrôles ISO enrichissent l\'analyse mais ne bloquent pas le workflow.'),
        React.createElement('button', { style: btnSmallPrimary }, '+ Ajouter un contrôle'),
        w.isoControls.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Référence'),
                React.createElement('th', null, 'Nom'),
                React.createElement('th', null, 'Statut'),
                React.createElement('th', null, 'Commentaires'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.isoControls.map(c => {
                const sCls = { appliqué: 'badge-done', partiel: 'badge-inprogress', non_appliqué: 'badge-blocked', en_cours: 'badge-inprogress' }[c.status];
                return React.createElement('tr', { key: c.id },
                  React.createElement('td', null, React.createElement('strong', null, escapeHtml(c.reference))),
                  React.createElement('td', null, escapeHtml(c.name)),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(sCls) }, escapeHtml(c.status))),
                  React.createElement('td', null, escapeHtml(c.comments || '—')),
                  React.createElement('td', null,
                    React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'isoControl', data: c }) }, '✏️')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun contrôle saisi.')
      ), ShieldCheck
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATELIER 2 : SOURCES DE RISQUE
// ─────────────────────────────────────────────────────────────────────────────
function Atelier2Content({ study, openSections, toggleSection, setEditModal }) {
  const w = study.workshops[2];
  const w1 = study.workshops[1];
  const a1ok = w1.missions?.length > 0 && w1.businessValues?.length > 0 && w1.fearedEvents?.length > 0;

  const renderSection = (key, num, title, badge, body, defaultOpen = true) => {
    const isOpen = openSections[key] !== undefined ? openSections[key] : defaultOpen;
    return React.createElement('div', { key: key, style: sectionCard },
      React.createElement('div', { 
        style: { ...sectionHeader, ...(isOpen && sectionHeaderOpen) }, 
        onClick: () => toggleSection(key) 
      },
        React.createElement('div', { style: sectionHeaderTitle },
          React.createElement('span', { style: sectionNumBadge }, num),
          React.createElement('span', null, title),
          badge && React.createElement('span', { style: countBadge }, badge)
        ),
        React.createElement('span', { style: { ...chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' } }, '›')
      ),
      React.createElement('div', { style: { display: isOpen ? 'block' : 'none' } },
        React.createElement('div', { style: sectionBody }, body)
      )
    );
  };

  return React.createElement('div', null,
    !a1ok && React.createElement('div', { style: blockedAlert }, 'Atelier 1 incomplet — Au moins une mission, une valeur métier et un événement redouté requis'),
    renderSection('w2_rs', 1, 'Sources de risque', w.riskSources.length,
      React.createElement('div', null,
        !a1ok && React.createElement('div', { style: blockedAlert }, 'Atelier 1 requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !a1ok }, '+ Ajouter une source de risque'),
        w.riskSources.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Nom'),
                React.createElement('th', null, 'Type'),
                React.createElement('th', null, 'Motivation'),
                React.createElement('th', null, 'Capacité'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.riskSources.map(r => React.createElement('tr', { key: r.id },
                React.createElement('td', null, React.createElement('strong', null, escapeHtml(r.name))),
                React.createElement('td', null, escapeHtml(r.type)),
                React.createElement('td', null, escapeHtml(r.motivation || '—')),
                React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${r.capability}`) }, r.capability)),
                React.createElement('td', null,
                  React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'riskSource', data: r }) }, '✏️')
                )
              ))
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucune source de risque.')
      )
    ),
    renderSection('w2_ov', 2, 'Objectifs visés', w.targetObjectives.length,
      React.createElement('div', null,
        !w.riskSources.length && React.createElement('div', { style: blockedAlert }, 'Sources de risque requises'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.riskSources.length }, '+ Ajouter un objectif visé'),
        w.targetObjectives.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Nom'),
                React.createElement('th', null, 'Événements redoutés liés'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.targetObjectives.map(o => React.createElement('tr', { key: o.id },
                React.createElement('td', null, React.createElement('strong', null, escapeHtml(o.name))),
                React.createElement('td', null, 
                  (o.fearedEventIds || []).map(id => {
                    const e = w1.fearedEvents?.find(fe => fe.id === id);
                    return React.createElement('span', { key: id, style: tagStyle }, escapeHtml(e?.description?.slice(0, 40) || '?'));
                  })
                ),
                React.createElement('td', null,
                  React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'targetObjective', data: o }) }, '✏️')
                )
              ))
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun objectif visé.')
      )
    ),
    renderSection('w2_pairs', 3, 'Couples SR/OV & Pertinence', w.sourceObjectivePairs.filter(p => p.retained).length,
      React.createElement('div', null,
        (!w.riskSources.length || !w.targetObjectives.length) && React.createElement('div', { style: blockedAlert }, 'Sources de risque et objectifs visés requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.riskSources.length || !w.targetObjectives.length }, '+ Créer un couple SR/OV'),
        w.sourceObjectivePairs.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Source de risque'),
                React.createElement('th', null, 'Objectif visé'),
                React.createElement('th', null, 'Pertinent ?'),
                React.createElement('th', null, 'Justification'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.sourceObjectivePairs.map(p => {
                const rs = w.riskSources.find(r => r.id === p.riskSourceId);
                const ov = w.targetObjectives.find(o => o.id === p.targetObjectiveId);
                return React.createElement('tr', { key: p.id },
                  React.createElement('td', null, escapeHtml(rs?.name || '?')),
                  React.createElement('td', null, escapeHtml(ov?.name || '?')),
                  React.createElement('td', null, React.createElement('button', { style: badgeStyle(p.retained ? 'badge-done' : 'badge-draft') }, p.retained ? '✓ Pertinent' : '✗ Non pertinent')),
                  React.createElement('td', null, escapeHtml(p.justification || '—')),
                  React.createElement('td', null,
                    React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun couple SR/OV.')
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATELIER 3 : SCÉNARIOS STRATÉGIQUES
// ─────────────────────────────────────────────────────────────────────────────
function Atelier3Content({ study, openSections, toggleSection, setEditModal }) {
  const w = study.workshops[3];
  const w2 = study.workshops[2];
  const a2ok = w2.sourceObjectivePairs?.some(p => p.retained);

  const renderSection = (key, num, title, badge, body, defaultOpen = true) => {
    const isOpen = openSections[key] !== undefined ? openSections[key] : defaultOpen;
    return React.createElement('div', { key: key, style: sectionCard },
      React.createElement('div', { 
        style: { ...sectionHeader, ...(isOpen && sectionHeaderOpen) }, 
        onClick: () => toggleSection(key) 
      },
        React.createElement('div', { style: sectionHeaderTitle },
          React.createElement('span', { style: sectionNumBadge }, num),
          React.createElement('span', null, title),
          badge && React.createElement('span', { style: countBadge }, badge)
        ),
        React.createElement('span', { style: { ...chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' } }, '›')
      ),
      React.createElement('div', { style: { display: isOpen ? 'block' : 'none' } },
        React.createElement('div', { style: sectionBody }, body)
      )
    );
  };

  return React.createElement('div', null,
    !a2ok && React.createElement('div', { style: blockedAlert }, 'Atelier 2 incomplet — Au moins un couple SR/OV pertinent requis'),
    renderSection('w3_pp', 1, 'Parties prenantes', w.stakeholders.length,
      React.createElement('div', null,
        !a2ok && React.createElement('div', { style: blockedAlert }, 'Atelier 2 requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !a2ok }, '+ Ajouter une partie prenante'),
        w.stakeholders.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Nom'),
                React.createElement('th', null, 'Type'),
                React.createElement('th', null, 'Exposition'),
                React.createElement('th', null, 'Fiabilité'),
                React.createElement('th', null, 'Accès'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.stakeholders.map(p => React.createElement('tr', { key: p.id },
                React.createElement('td', null, React.createElement('strong', null, escapeHtml(p.name))),
                React.createElement('td', null, escapeHtml(p.type)),
                React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${p.exposure}`) }, p.exposure)),
                React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${p.reliability}`) }, p.reliability)),
                React.createElement('td', null, escapeHtml(p.access || '—')),
                React.createElement('td', null,
                  React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'stakeholder', data: p }) }, '✏️')
                )
              ))
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucune partie prenante.')
      )
    ),
    renderSection('w3_ss', 2, 'Scénarios stratégiques', w.strategicScenarios.length,
      React.createElement('div', null,
        !w2.sourceObjectivePairs?.filter(p => p.retained).length && React.createElement('div', { style: blockedAlert }, 'Couples SR/OV pertinents requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w2.sourceObjectivePairs?.filter(p => p.retained).length }, '+ Créer un scénario stratégique'),
        w.strategicScenarios.length ? w.strategicScenarios.map(ss => {
          const cp = w2.sourceObjectivePairs?.find(p => p.id === ss.coupleId);
          const rs = cp ? w2.riskSources?.find(r => r.id === cp.riskSourceId) : null;
          const ov = cp ? w2.targetObjectives?.find(o => o.id === cp.targetObjectiveId) : null;
          return React.createElement('div', { key: ss.id, style: itemRow },
            React.createElement('div', { style: itemInfo },
              React.createElement('div', { style: itemName }, escapeHtml(ss.name)),
              React.createElement('div', { style: itemDesc }, `${escapeHtml(rs?.name || '?')} → ${escapeHtml(ov?.name || '?')}`),
              ss.description && React.createElement('div', { style: itemDesc }, escapeHtml(ss.description))
            ),
            React.createElement('div', { style: { display: 'flex', gap: 7 } },
              React.createElement('span', { style: badgeStyle(`lvl-${ss.gravity}`) }, `G${ss.gravity}`),
              React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
            )
          );
        }) : React.createElement('p', { style: emptyText }, 'Aucun scénario stratégique.')
      )
    ),
    renderSection('w3_treat', 3, 'Traitement des risques stratégiques', w.treatments.length,
      React.createElement('div', null,
        !w.strategicScenarios.length && React.createElement('div', { style: blockedAlert }, 'Scénarios stratégiques requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.strategicScenarios.length }, '+ Ajouter un traitement'),
        w.treatments.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Scénario'),
                React.createElement('th', null, 'Décision'),
                React.createElement('th', null, 'Justification'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.treatments.map(t => {
                const ss = w.strategicScenarios.find(s => s.id === t.scenarioId);
                return React.createElement('tr', { key: t.id },
                  React.createElement('td', null, escapeHtml(ss?.name || '?')),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle('badge-inprogress') }, escapeHtml(t.decision))),
                  React.createElement('td', null, escapeHtml(t.justification || '—')),
                  React.createElement('td', null,
                    React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun traitement stratégique.')
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATELIER 4 : SCÉNARIOS OPÉRATIONNELS
// ─────────────────────────────────────────────────────────────────────────────
function Atelier4Content({ study, openSections, toggleSection, setEditModal }) {
  const w = study.workshops[4];
  const w3 = study.workshops[3];
  const a3ok = w3.strategicScenarios?.length > 0;

  const renderSection = (key, num, title, badge, body, defaultOpen = true) => {
    const isOpen = openSections[key] !== undefined ? openSections[key] : defaultOpen;
    return React.createElement('div', { key: key, style: sectionCard },
      React.createElement('div', { 
        style: { ...sectionHeader, ...(isOpen && sectionHeaderOpen) }, 
        onClick: () => toggleSection(key) 
      },
        React.createElement('div', { style: sectionHeaderTitle },
          React.createElement('span', { style: sectionNumBadge }, num),
          React.createElement('span', null, title),
          badge && React.createElement('span', { style: countBadge }, badge)
        ),
        React.createElement('span', { style: { ...chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' } }, '›')
      ),
      React.createElement('div', { style: { display: isOpen ? 'block' : 'none' } },
        React.createElement('div', { style: sectionBody }, body)
      )
    );
  };

  return React.createElement('div', null,
    !a3ok && React.createElement('div', { style: blockedAlert }, 'Atelier 3 incomplet — Au moins un scénario stratégique requis'),
    renderSection('w4_mo', 1, 'Modes opératoires', w.operationalModes.length,
      React.createElement('div', null,
        !a3ok && React.createElement('div', { style: blockedAlert }, 'Atelier 3 requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !a3ok }, '+ Ajouter un mode opératoire'),
        w.operationalModes.length ? w.operationalModes.map(m => {
          const ss = w3.strategicScenarios?.find(s => s.id === m.strategicScenarioId);
          return React.createElement('div', { key: m.id, style: itemRow },
            React.createElement('div', { style: itemInfo },
              React.createElement('div', { style: itemName }, escapeHtml(m.name)),
              React.createElement('div', { style: itemDesc }, escapeHtml(ss?.name || '?'))
            ),
            React.createElement('div', { style: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' } },
              (m.technics || []).map(t => React.createElement('span', { key: t, style: tagStyle }, escapeHtml(t))),
              React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'operationalMode', data: m }) }, '✏️'),
              React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
            )
          );
        }) : React.createElement('p', { style: emptyText }, 'Aucun mode opératoire.')
      )
    ),
    renderSection('w4_so', 2, 'Scénarios opérationnels', w.operationalScenarios.length,
      React.createElement('div', null,
        !w.operationalModes.length && React.createElement('div', { style: blockedAlert }, 'Modes opératoires requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.operationalModes.length }, '+ Créer un scénario opérationnel'),
        w.operationalScenarios.length ? w.operationalScenarios.map(so => {
          const ss = w3.strategicScenarios?.find(s => s.id === so.strategicScenarioId);
          return React.createElement('div', { key: so.id, style: { ...itemRow, flexDirection: 'column', alignItems: 'flex-start', gap: 7 } },
            React.createElement('div', { style: { display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('div', { style: itemName }, escapeHtml(so.name)),
              React.createElement('div', { style: { display: 'flex', gap: 7 } },
                React.createElement('span', { style: badgeStyle(`lvl-${so.likelihood}`) }, `V${so.likelihood}`),
                React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
              )
            ),
            React.createElement('div', { style: { fontSize: 12, color: T.gray400 } }, `Scénario stratégique : ${escapeHtml(ss?.name || '?')}`)
          );
        }) : React.createElement('p', { style: emptyText }, 'Aucun scénario opérationnel.')
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ATELIER 5 : TRAITEMENT DU RISQUE
// ─────────────────────────────────────────────────────────────────────────────
function Atelier5Content({ study, openSections, toggleSection, setEditModal }) {
  const w = study.workshops[5];
  const w4 = study.workshops[4];
  const a4ok = w4.operationalScenarios?.length > 0;

  const renderSection = (key, num, title, badge, body, defaultOpen = true) => {
    const isOpen = openSections[key] !== undefined ? openSections[key] : defaultOpen;
    return React.createElement('div', { key: key, style: sectionCard },
      React.createElement('div', { 
        style: { ...sectionHeader, ...(isOpen && sectionHeaderOpen) }, 
        onClick: () => toggleSection(key) 
      },
        React.createElement('div', { style: sectionHeaderTitle },
          React.createElement('span', { style: sectionNumBadge }, num),
          React.createElement('span', null, title),
          badge && React.createElement('span', { style: countBadge }, badge)
        ),
        React.createElement('span', { style: { ...chevron, transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' } }, '›')
      ),
      React.createElement('div', { style: { display: isOpen ? 'block' : 'none' } },
        React.createElement('div', { style: sectionBody }, body)
      )
    );
  };

  const riskLevel = (g, v) => {
    const s = g * v;
    if (s <= 2) return { label: 'Faible', cls: 'lvl-1' };
    if (s <= 6) return { label: 'Moyen', cls: 'lvl-2' };
    if (s <= 9) return { label: 'Élevé', cls: 'lvl-3' };
    return { label: 'Critique', cls: 'lvl-4' };
  };

  return React.createElement('div', null,
    !a4ok && React.createElement('div', { style: blockedAlert }, 'Atelier 4 incomplet — Au moins un scénario opérationnel requis'),
    renderSection('w5_rr', 1, 'Registre des risques', w.riskEntries.length,
      React.createElement('div', null,
        !a4ok && React.createElement('div', { style: blockedAlert }, 'Atelier 4 requis'),
        React.createElement('div', { style: helpTip }, 'ℹ️ Niveau de risque = Gravité × Vraisemblance. Calculé automatiquement.'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !a4ok }, '+ Ajouter au registre'),
        w.riskEntries.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Scénario opérationnel'),
                React.createElement('th', null, 'Gravité'),
                React.createElement('th', null, 'Vraisemblance'),
                React.createElement('th', null, 'Niveau de risque'),
                React.createElement('th', null, 'Traitement'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.riskEntries.map(r => {
                const so = w4.operationalScenarios?.find(o => o.id === r.operationalScenarioId);
                const rl = riskLevel(r.gravity, r.likelihood);
                return React.createElement('tr', { key: r.id },
                  React.createElement('td', null, escapeHtml(so?.name || '?')),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${r.gravity}`) }, `G${r.gravity}`)),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${r.likelihood}`) }, `V${r.likelihood}`)),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(rl.cls) }, rl.label)),
                  React.createElement('td', null, escapeHtml(r.treatment)),
                  React.createElement('td', null,
                    React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Registre vide.')
      )
    ),
    renderSection('w5_measures', 2, 'Mesures de sécurité', w.measures.length,
      React.createElement('div', null,
        !w.riskEntries.length && React.createElement('div', { style: blockedAlert }, 'Registre requis'),
        React.createElement('div', { style: measureCategories },
          ['Gouvernance', 'Protection', 'Défense', 'Résilience', 'Conformité'].map(cat => {
            const catMeasures = w.measures.filter(m => m.category === cat);
            return React.createElement('div', { key: cat, style: { marginBottom: 14 } },
              React.createElement('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 } },
                React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: 8 } },
                  React.createElement('span', null, cat === 'Gouvernance' ? '🏛️' : cat === 'Protection' ? '🛡️' : cat === 'Défense' ? '⚔️' : cat === 'Résilience' ? '🔄' : '✅'),
                  React.createElement('span', { style: { fontSize: 13, fontWeight: 700 } }, cat),
                  React.createElement('span', { style: countBadge }, catMeasures.length)
                ),
                React.createElement('button', { style: btnSmallPrimary, disabled: !w.riskEntries.length }, '+ Ajouter')
              ),
              React.createElement('div', { style: measureGroupBox },
                catMeasures.length ? catMeasures.map(m => React.createElement('div', { key: m.id, style: itemRow },
                  React.createElement('div', { style: itemInfo },
                    React.createElement('div', { style: itemName }, escapeHtml(m.name)),
                    React.createElement('div', { style: itemDesc }, escapeHtml(m.description?.slice(0, 60) || ''))
                  ),
                  React.createElement('div', { style: { display: 'flex', gap: 7, alignItems: 'center' } },
                    React.createElement('span', { style: badgeStyle({ Critique: 'lvl-4', Haute: 'lvl-3', Moyenne: 'lvl-2', Faible: 'lvl-1' }[m.priority]) }, escapeHtml(m.priority)),
                    React.createElement('button', { style: badgeStyle(m.status === 'Fait' ? 'badge-done' : 'badge-inprogress') }, escapeHtml(m.status)),
                    React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: true, type: 'measure', data: m }) }, '✏️'),
                    React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
                  )
                )) : React.createElement('p', { style: emptyTextSmall }, 'Aucune mesure dans cette catégorie.')
              )
            );
          })
        )
      )
    ),
    renderSection('w5_res', 3, 'Risques résiduels', w.residualRisks.length,
      React.createElement('div', null,
        !w.riskEntries.length && React.createElement('div', { style: blockedAlert }, 'Registre requis'),
        React.createElement('button', { style: btnSmallPrimary, disabled: !w.riskEntries.length }, '+ Ajouter un risque résiduel'),
        w.residualRisks.length ? React.createElement('div', { style: tableWrap },
          React.createElement('table', { style: table },
            React.createElement('thead', null,
              React.createElement('tr', null,
                React.createElement('th', null, 'Risque initial'),
                React.createElement('th', null, 'Niveau initial'),
                React.createElement('th', null, 'Gravité résid.'),
                React.createElement('th', null, 'Vrais. résid.'),
                React.createElement('th', null, 'Niveau résid.'),
                React.createElement('th', null, 'Justification'),
                React.createElement('th', null)
              )
            ),
            React.createElement('tbody', null,
              w.residualRisks.map(r => {
                const entry = w.riskEntries.find(e => e.id === r.riskEntryId);
                const so = entry ? w4.operationalScenarios?.find(o => o.id === entry.operationalScenarioId) : null;
                const init = entry ? riskLevel(entry.gravity, entry.likelihood) : { label: '?', cls: '' };
                const resid = riskLevel(r.residualGravity, r.residualLikelihood);
                return React.createElement('tr', { key: r.id },
                  React.createElement('td', null, escapeHtml(so?.name || '?')),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(init.cls) }, init.label)),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${r.residualGravity}`) }, `G${r.residualGravity}`)),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(`lvl-${r.residualLikelihood}`) }, `V${r.residualLikelihood}`)),
                  React.createElement('td', null, React.createElement('span', { style: badgeStyle(resid.cls) }, resid.label)),
                  React.createElement('td', null, escapeHtml(r.justification || '—')),
                  React.createElement('td', null,
                    React.createElement('button', { style: { ...iconBtn, color: '#dc2626' } }, '🗑')
                  )
                );
              })
            )
          )
        ) : React.createElement('p', { style: emptyText }, 'Aucun risque résiduel.')
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL D'ÉDITION
// ─────────────────────────────────────────────────────────────────────────────
function EditModal({ editModal, setEditModal, study }) {
  const { type, data } = editModal;

  const getModalTitle = () => {
    const titles = {
      team: data ? 'Modifier membre d\'équipe' : 'Ajouter un membre d\'équipe',
      businessValue: data ? 'Modifier valeur métier' : 'Ajouter une valeur métier',
      supportingAsset: data ? 'Modifier bien support' : 'Ajouter un bien support',
      fearedEvent: data ? 'Modifier événement redouté' : 'Ajouter un événement redouté',
      isoControl: data ? 'Modifier contrôle ISO' : 'Ajouter un contrôle ISO',
      riskSource: data ? 'Modifier source de risque' : 'Ajouter une source de risque',
      targetObjective: data ? 'Modifier objectif visé' : 'Ajouter un objectif visé',
      stakeholder: data ? 'Modifier partie prenante' : 'Ajouter une partie prenante',
      operationalMode: data ? 'Modifier mode opératoire' : 'Ajouter un mode opératoire',
      measure: data ? 'Modifier mesure de sécurité' : 'Ajouter une mesure de sécurité'
    };
    return titles[type] || 'Modifier';
  };

  return React.createElement('div', { style: modalOverlay, onClick: () => setEditModal({ open: false, type: null, data: null }) },
    React.createElement('div', { style: modalBox, onClick: e => e.stopPropagation() },
      React.createElement('div', { style: modalHead },
        React.createElement('span', { style: modalTitle }, getModalTitle()),
        React.createElement('button', { style: iconBtn, onClick: () => setEditModal({ open: false, type: null, data: null }) }, '✕')
      ),
      React.createElement('div', { style: modalBody },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12 } },
          type === 'team' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Rôle'), React.createElement('input', { style: formInput, defaultValue: data?.role || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Responsabilité'), React.createElement('input', { style: formInput, defaultValue: data?.responsibility || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Contact'), React.createElement('input', { style: formInput, defaultValue: data?.contact || '' }))
          ),
          type === 'businessValue' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Mission'),
              React.createElement('select', { style: formSelect, defaultValue: data?.missionId || '' },
                study.workshops[1].missions.map(m => React.createElement('option', { key: m.id, value: m.id }, m.name))
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Type'), React.createElement('input', { style: formInput, defaultValue: data?.type || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Description'), React.createElement('textarea', { style: formTextarea, rows: 3, defaultValue: data?.description || '' }))
          ),
          type === 'supportingAsset' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Valeur métier'),
              React.createElement('select', { style: formSelect, defaultValue: data?.businessValueId || '' },
                study.workshops[1].businessValues.map(v => React.createElement('option', { key: v.id, value: v.id }, v.name))
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Type'), React.createElement('input', { style: formInput, defaultValue: data?.type || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Localisation'), React.createElement('input', { style: formInput, defaultValue: data?.location || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Criticité'),
              React.createElement('select', { style: formSelect, defaultValue: data?.criticality || 'Moyenne' },
                React.createElement('option', null, 'Faible'),
                React.createElement('option', null, 'Moyenne'),
                React.createElement('option', null, 'Élevée'),
                React.createElement('option', null, 'Critique')
              )
            )
          ),
          type === 'fearedEvent' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Valeur métier'),
              React.createElement('select', { style: formSelect, defaultValue: data?.businessValueId || '' },
                study.workshops[1].businessValues.map(v => React.createElement('option', { key: v.id, value: v.id }, v.name))
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Description'), React.createElement('textarea', { style: formTextarea, rows: 3, defaultValue: data?.description || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Impact'), React.createElement('input', { style: formInput, defaultValue: data?.impact || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Gravité'),
              React.createElement('select', { style: formSelect, defaultValue: data?.gravity || 2 },
                React.createElement('option', { value: 1 }, 'G1 — Mineure'),
                React.createElement('option', { value: 2 }, 'G2 — Significative'),
                React.createElement('option', { value: 3 }, 'G3 — Grave'),
                React.createElement('option', { value: 4 }, 'G4 — Critique')
              )
            )
          ),
          type === 'isoControl' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Référence'), React.createElement('input', { style: formInput, defaultValue: data?.reference || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Statut'),
              React.createElement('select', { style: formSelect, defaultValue: data?.status || 'non_appliqué' },
                React.createElement('option', null, 'appliqué'),
                React.createElement('option', null, 'partiel'),
                React.createElement('option', null, 'non_appliqué'),
                React.createElement('option', null, 'en_cours')
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Commentaires'), React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: data?.comments || '' }))
          ),
          type === 'riskSource' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Type'),
              React.createElement('select', { style: formSelect, defaultValue: data?.type || 'Externe' },
                React.createElement('option', null, 'Externe'),
                React.createElement('option', null, 'Interne'),
                React.createElement('option', null, 'Partenaire')
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Motivation'), React.createElement('input', { style: formInput, defaultValue: data?.motivation || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Capacité (1-4)'),
              React.createElement('select', { style: formSelect, defaultValue: data?.capability || 2 },
                React.createElement('option', { value: 1 }, '1 — Faible'),
                React.createElement('option', { value: 2 }, '2 — Moyenne'),
                React.createElement('option', { value: 3 }, '3 — Élevée'),
                React.createElement('option', { value: 4 }, '4 — Maximale')
              )
            )
          ),
          type === 'targetObjective' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Description'), React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: data?.description || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Événements redoutés liés'),
              React.createElement('select', { style: formSelect, multiple: true, size: 3, defaultValue: data?.fearedEventIds || [] },
                study.workshops[1].fearedEvents.map(e => React.createElement('option', { key: e.id, value: e.id }, e.description.slice(0, 50)))
              )
            )
          ),
          type === 'stakeholder' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Type'),
              React.createElement('select', { style: formSelect, defaultValue: data?.type || 'Sous-traitant' },
                React.createElement('option', null, 'Sous-traitant'),
                React.createElement('option', null, 'Partenaire'),
                React.createElement('option', null, 'Client'),
                React.createElement('option', null, 'Fournisseur')
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Exposition (1-4)'),
              React.createElement('select', { style: formSelect, defaultValue: data?.exposure || 2 },
                [1, 2, 3, 4].map(n => React.createElement('option', { key: n, value: n }, n))
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Fiabilité (1-4)'),
              React.createElement('select', { style: formSelect, defaultValue: data?.reliability || 2 },
                [1, 2, 3, 4].map(n => React.createElement('option', { key: n, value: n }, n))
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Accès'), React.createElement('input', { style: formInput, defaultValue: data?.access || '' }))
          ),
          type === 'operationalMode' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Scénario stratégique'),
              React.createElement('select', { style: formSelect, defaultValue: data?.strategicScenarioId || '' },
                study.workshops[3].strategicScenarios.map(ss => React.createElement('option', { key: ss.id, value: ss.id }, ss.name))
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Techniques MITRE'), React.createElement('input', { style: formInput, defaultValue: (data?.technics || []).join(', ') })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Description'), React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: data?.description || '' }))
          ),
          type === 'measure' && React.createElement(React.Fragment, null,
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Nom'), React.createElement('input', { style: formInput, defaultValue: data?.name || '' })),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Catégorie'),
              React.createElement('select', { style: formSelect, defaultValue: data?.category || 'Gouvernance' },
                React.createElement('option', null, 'Gouvernance'),
                React.createElement('option', null, 'Protection'),
                React.createElement('option', null, 'Défense'),
                React.createElement('option', null, 'Résilience'),
                React.createElement('option', null, 'Conformité')
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Priorité'),
              React.createElement('select', { style: formSelect, defaultValue: data?.priority || 'Moyenne' },
                React.createElement('option', null, 'Critique'),
                React.createElement('option', null, 'Haute'),
                React.createElement('option', null, 'Moyenne'),
                React.createElement('option', null, 'Faible')
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Statut'),
              React.createElement('select', { style: formSelect, defaultValue: data?.status || 'À faire' },
                React.createElement('option', null, 'À faire'),
                React.createElement('option', null, 'En cours'),
                React.createElement('option', null, 'Fait')
              )
            ),
            React.createElement('div', { style: formGroup }, React.createElement('label', { style: formLabel }, 'Description'), React.createElement('textarea', { style: formTextarea, rows: 2, defaultValue: data?.description || '' }))
          )
        )
      ),
      React.createElement('div', { style: modalFoot },
        React.createElement('button', { style: btnSecondary, onClick: () => setEditModal({ open: false, type: null, data: null }) }, 'Annuler'),
        React.createElement('button', { style: btnPrimary }, 'Enregistrer')
      )
    )
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────────────────────────────────────
function getAtelierTitle(num) {
  const titles = {
    1: 'Cadrage et Socle de Sécurité',
    2: 'Sources de Risque',
    3: 'Scénarios Stratégiques',
    4: 'Scénarios Opérationnels',
    5: 'Traitement du Risque'
  };
  return titles[num];
}

function getAtelierDesc(num) {
  const descs = {
    1: 'Définir le périmètre de l\'étude, identifier les missions, valeurs métier, biens supports et événements redoutés',
    2: 'Identifier les sources de risque (menaces) et leurs objectifs, établir les couples pertinents',
    3: 'Construire les scénarios d\'attaque stratégiques et définir les parties prenantes',
    4: 'Détailler les modes opératoires techniques et construire les scénarios opérationnels',
    5: 'Évaluer les risques, définir les mesures de sécurité et analyser les risques résiduels'
  };
  return descs[num];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES (OBJETS)
// ─────────────────────────────────────────────────────────────────────────────
const btnPrimaryStyle = {
  background: T.gradBlue, color: '#fff', border: 'none', padding: '12px 20px',
  borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(29,78,216,0.2)'
};

const searchSubtle = {
  width: '100%', padding: '12px 40px', fontSize: 14, border: '1.5px solid #E5E7EB',
  borderRadius: 12, outline: 'none', fontFamily: T.font, background: '#fff'
};

const studyCardStyle = {
  background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow,
  cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
};

const cardStrip = {
  position: 'absolute', top: 0, left: 0, right: 0, height: 4
};

const iconBoxStyle = {
  width: 44, height: 44, borderRadius: 12, background: T.gradBlue,
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};

const domaineBadgeStyle = {
  display: 'inline-block', fontSize: 10, fontWeight: 800, color: T.accent,
  background: '#EEF2FF', padding: '2px 8px', borderRadius: 99, marginBottom: 4, textTransform: 'uppercase'
};

const backBtnStyle = {
  display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none',
  color: T.gray500, fontWeight: 700, fontSize: 13, cursor: 'pointer', marginBottom: 20
};

const studyHeaderCard = {
  background: 'linear-gradient(135deg, #1a3a7e 0%, #7c3aed 100%)',
  borderRadius: 16, padding: '24px', marginBottom: 24, color: '#fff'
};

const studyHeaderMeta = {
  display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 16
};

const atelierTabs = {
  display: 'flex', gap: 8, marginBottom: 24, background: '#fff', padding: '8px',
  borderRadius: 16, boxShadow: T.shadow
};

const atelierTabStyle = (active, blocked) => ({
  flex: 1, padding: '12px', borderRadius: 10, border: 'none',
  background: active ? T.gradBlue : 'transparent',
  color: active ? '#fff' : blocked ? T.gray400 : T.gray500,
  fontWeight: 700, fontSize: 13, cursor: blocked ? 'not-allowed' : 'pointer',
  transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  opacity: blocked ? 0.6 : 1
});

const tabNumStyle = {
  width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700
};

const progressDot = {
  width: 7, height: 7, borderRadius: '50%', background: '#D97706', display: 'inline-block', marginLeft: 6
};

const mainAtelierCard = {
  background: '#fff', borderRadius: 24, padding: '32px', boxShadow: T.shadow
};

const statusPill = {
  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800,
  display: 'inline-flex', alignItems: 'center', gap: 6
};

const sectionCard = {
  background: '#fff', border: `1px solid ${T.gray200}`, borderRadius: T.radius,
  marginBottom: 18, overflow: 'hidden', boxShadow: T.shadow
};

const sectionHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid transparent',
  transition: 'background 0.15s'
};

const sectionHeaderOpen = {
  borderBottomColor: T.gray200
};

const sectionHeaderTitle = {
  display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 14, color: T.gray900
};

const sectionNumBadge = {
  width: 24, height: 24, borderRadius: 6, background: '#EEF2FF', color: T.accent,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700
};

const chevron = {
  color: T.gray400, transition: 'transform 0.2s', fontSize: 16
};

const sectionBody = {
  padding: '20px'
};

const countBadge = {
  background: '#EEF2FF', color: T.accent, padding: '2px 8px', borderRadius: 99,
  fontSize: 11, fontWeight: 600, marginLeft: 8
};

const formGrid = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14
};

const formGroup = {
  display: 'flex', flexDirection: 'column', gap: 5
};

const formLabel = {
  fontSize: 11, fontWeight: 600, color: T.gray500, textTransform: 'uppercase', letterSpacing: '0.4px'
};

const formInput = {
  background: T.white, border: `1px solid ${T.gray200}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 13, fontFamily: T.font, width: '100%'
};

const formTextarea = {
  background: T.white, border: `1px solid ${T.gray200}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 13, fontFamily: T.font, width: '100%', resize: 'vertical'
};

const formSelect = {
  background: T.white, border: `1px solid ${T.gray200}`, borderRadius: T.radiusSm,
  padding: '9px 12px', fontSize: 13, fontFamily: T.font, width: '100%'
};

const helpTip = {
  fontSize: 11, color: T.accent, background: '#EEF2FF', border: `1px solid #DBEAFE`,
  borderRadius: T.radiusSm, padding: '10px 12px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start'
};

const btnSmallPrimary = {
  background: T.accent, color: '#fff', border: 'none', padding: '6px 14px',
  borderRadius: T.radiusSm, fontWeight: 600, fontSize: 12, cursor: 'pointer',
  display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12
};

const tableWrap = {
  overflowX: 'auto'
};

const table = {
  width: '100%', borderCollapse: 'collapse', fontSize: 13
};

const emptyText = {
  color: T.gray400, fontSize: 13, fontStyle: 'italic', padding: '28px', textAlign: 'center'
};

const emptyTextSmall = {
  color: T.gray400, fontSize: 12, fontStyle: 'italic', padding: '8px'
};

const blockedAlert = {
  background: '#FEE2E2', borderLeft: `3px solid #DC2626`, padding: '14px 16px',
  borderRadius: T.radiusSm, marginBottom: 18, color: '#B91C1C', fontSize: 13, fontWeight: 500
};

const chips = {
  display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8
};

const missionChip = {
  background: '#EEF2FF', color: T.accent, border: `1px solid #DBEAFE`,
  padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 500,
  display: 'inline-flex', alignItems: 'center', gap: 6
};

const chipRemove = {
  background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: 14, padding: 0
};

const tagStyle = {
  display: 'inline-block', background: '#EEF2FF', color: T.accent,
  padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, margin: '2px'
};

const itemRow = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  background: '#F9FAFB', border: `1px solid ${T.gray200}`, borderRadius: T.radiusSm,
  padding: '12px 14px', gap: 12, marginBottom: 6
};

const itemInfo = {
  flex: 1, minWidth: 0
};

const itemName = {
  fontWeight: 600, color: T.gray800, fontSize: 13
};

const itemDesc = {
  fontSize: 11, color: T.gray400, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
};

const iconBtn = {
  background: T.white, border: `1px solid ${T.gray200}`, borderRadius: T.radiusXs,
  width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: T.gray400, fontSize: 12
};

const measureCategories = {
  display: 'flex', flexDirection: 'column', gap: 16
};

const measureGroupBox = {
  background: '#F9FAFB', border: `1px solid ${T.gray200}`, borderRadius: T.radiusSm, padding: '8px 10px'
};

const badgeStyle = (cls) => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px',
  borderRadius: 100, fontSize: 11, fontWeight: 600,
  background: cls?.includes('lvl-1') ? '#DCFCE7' : cls?.includes('lvl-2') ? '#FEF3C7' : cls?.includes('lvl-3') ? '#FFEDD5' : cls?.includes('lvl-4') ? '#FEE2E2' : '#F3F4F6',
  color: cls?.includes('lvl-1') ? '#16a34a' : cls?.includes('lvl-2') ? '#d97706' : cls?.includes('lvl-3') ? '#ea580c' : cls?.includes('lvl-4') ? '#dc2626' : T.gray500
});

const modalOverlay = {
  position: 'fixed', inset: 0, background: 'rgba(15,38,84,0.6)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(6px)'
};

const modalBox = {
  background: T.white, borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(15,38,84,0.2)'
};

const modalHead = {
  padding: '20px 24px 16px', borderBottom: `1px solid ${T.gray200}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
};

const modalTitle = {
  fontFamily: T.font, fontSize: 16, fontWeight: 800, color: T.gray800
};

const modalBody = {
  padding: '20px 24px'
};

const modalFoot = {
  padding: '14px 24px', borderTop: `1px solid ${T.gray200}`, display: 'flex', justifyContent: 'flex-end', gap: 10
};

const btnSecondary = {
  background: T.white, color: T.gray700, border: `1px solid ${T.gray200}`,
  padding: '8px 16px', borderRadius: T.radiusSm, fontWeight: 500, fontSize: 13, cursor: 'pointer'
};

const btnPrimary = {
  background: T.accent, color: '#fff', border: 'none', padding: '8px 16px',
  borderRadius: T.radiusSm, fontWeight: 500, fontSize: 13, cursor: 'pointer'
};
