import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import isoLogo from "../assets/ISO.png";
import { resolveAssetUrl } from "../api/url";

// Fonction pour décoder le token JWT et extraire le rôle
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erreur décodage token:', error);
    return null;
  }
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser, user, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  // Redirection basée sur le user du contexte
  useEffect(() => {
    if (user) {
      console.log('User dans contexte:', user);
      if (isSuperAdmin) {
        navigate('/super-admin');
      } else {
        navigate('/tableau-bord');
      }
    }
  }, [user, isSuperAdmin, navigate]);

  const hasSociete = Boolean(user?.societeId || user?.societe?.id || user?.societe?.Id);
  const societeLogoPath = hasSociete
    ? (user?.societeLogo || user?.societe?.logoUrl || user?.societe?.logo || user?.logoUrl || user?.logo)
    : null;
  const logoImage = resolveAssetUrl(societeLogoPath, isoLogo);

  // Dans Login.jsx - modifier handleSubmit
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');
  try {
    const res = await login(form);
    console.log('Réponse API:', res.data);
    
    const { token, nomComplet, email, societe } = res.data;
    
    // Décoder le token pour extraire le rôle
    const decodedToken = decodeToken(token);
    console.log('Token décodé:', decodedToken);
    
    // Extraire le rôle du token (claim "role")
    const userRole = decodedToken?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken?.role;
    console.log('Rôle extrait:', userRole);
    
    // Créer l'objet utilisateur avec le rôle
    const userData = {
      id: decodedToken?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      token,
      nomComplet,
      email,
      societe,
      role: userRole,
      roleName: userRole,
      isActive: true
    };
    
    console.log('UserData à stocker:', userData);
    loginUser(userData);
    
  } catch (err) {
    console.error('Erreur:', err);
    const errorMessage = err.response?.data;
    
    // Vérifier si c'est une erreur de compte désactivé
    if (typeof errorMessage === 'string') {
      if (errorMessage.includes('désactivé') || errorMessage.includes('desactive') || errorMessage.includes('inactive')) {
        setError('❌ Votre compte a été désactivé. Veuillez contacter un administrateur.');
      } else {
        setError(errorMessage || 'Identifiants incorrects.');
      }
    } else {
      setError('Identifiants incorrects.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={styles.page}>

      {/* ── Left panel ── */}
      <div className="login-left-panel" style={styles.leftPanel}>
        <div style={styles.brandingContent}>
          <h1 style={styles.brandTitle}>SMSI Manager</h1>
          <p style={styles.brandSubtitle}>
            Système de Management<br />de la Sécurité de l'Information
          </p>
          <div style={styles.dividerLine} />
          <p style={styles.normeBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" />
              <path d="M9 12l2 2 4-4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Conforme ISO/IEC 27001:2022
          </p>
        </div>
        <div className="login-bg-circle-1" style={styles.bgCircle1} />
        <div className="login-bg-circle-2" style={styles.bgCircle2} />
      </div>

      {/* ── Right panel ── */}
      <div className="login-right-panel" style={styles.rightPanel}>
        
        {/* BOUTON RETOUR */}
        <button className="login-back-btn" onClick={() => navigate(-1)} style={styles.backBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour
        </button>

        <div className="login-form-card" style={styles.formCard}>

          {/* Logo above title */}
          <div style={styles.formHeader}>
            <img src={logoImage} alt="Logo" style={styles.logoImage} />
            <h2 style={styles.formTitle}>Connexion</h2>
            <p style={styles.formDesc}>Accédez à votre espace sécurisé</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.5" />
                <path d="M12 8v4M12 16h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Adresse email</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="5" width="18" height="14" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                    <path d="M3 9l9 6 9-6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="login-input"
                  type="email"
                  placeholder="votre@email.com"
                  style={styles.input}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mot de passe</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="5" y="11" width="14" height="10" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                    <path d="M8 11V7a4 4 0 018 0v4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="login-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  style={{ ...styles.input, paddingRight: '44px' }}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="current-password"
                  required
                />
                <button className="login-eye-btn" type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20C7 20 2.73 16.11 1 12c.812-1.95 2.1-3.67 3.72-4.99M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.89 11 8a10.22 10.22 0 01-2.65 4.24M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button className="login-submit-btn" type="submit" disabled={loading} style={styles.submitBtn}>
              <span style={styles.btnContent}>
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Se connecter
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes slideFadeInLeft { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideFadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatOne { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(10px,-12px) scale(1.03); } }
        @keyframes floatTwo { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-12px,12px) scale(1.04); } }

        .login-left-panel { animation: slideFadeInLeft 520ms ease-out both; }
        .login-right-panel { animation: slideFadeInUp 440ms ease-out both; }
        .login-form-card { animation: slideFadeInUp 540ms ease-out both; }
        .login-bg-circle-1 { animation: floatOne 12s ease-in-out infinite; }
        .login-bg-circle-2 { animation: floatTwo 14s ease-in-out infinite; }

        .login-back-btn:hover {
          color: #0f3da7;
          border-color: #bfd2f8;
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-1px);
        }

        .login-input:focus {
          border-color: #2f60d8 !important;
          box-shadow: 0 0 0 4px rgba(47, 96, 216, 0.12);
          background-color: #ffffff !important;
        }

        .login-eye-btn:hover {
          color: #2f60d8;
          transform: scale(1.05);
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(30, 79, 207, 0.32);
          filter: saturate(1.06);
        }

        .login-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .login-submit-btn:disabled { opacity: 0.78; cursor: not-allowed; }

        @media (max-width: 980px) {
          .login-left-panel { display: none; }
          .login-form-card { max-width: 460px; width: 100%; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    backgroundColor: '#eef3fb',
  },
  leftPanel: {
    width: '430px',
    flexShrink: 0,
    background: 'linear-gradient(155deg, #0d2460 0%, #1b3f9f 58%, #2a5de4 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  brandingContent: {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    padding: '48px',
    width: '100%',
  },
  brandTitle: {
    color: 'white',
    fontSize: '40px',
    fontWeight: '700',
    letterSpacing: 0,
    margin: '0 0 12px',
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: '15px',
    lineHeight: '1.75',
    margin: 0,
    fontWeight: '400',
  },
  dividerLine: {
    width: '56px',
    height: '1px',
    background: 'rgba(255,255,255,0.32)',
    margin: '28px auto',
  },
  normeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.86)',
    fontSize: '12px',
    letterSpacing: '0.4px',
    margin: 0,
    padding: '8px 12px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.16)',
  },
  bgCircle1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)',
    top: '-160px',
    right: '-200px',
  },
  bgCircle2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    bottom: '-120px',
    left: '-120px',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '56px',
    position: 'relative',
    background: 'radial-gradient(circle at 12% 10%, rgba(255,255,255,0.98) 0%, rgba(237,243,251,0.9) 55%, rgba(233,241,252,0.72) 100%)',
  },
  backBtn: {
    position: 'absolute',
    top: '30px',
    left: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.86)',
    border: '1px solid #dbe6f9',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '9px 14px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  formCard: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '1px solid #dde6f5',
    boxShadow: '0 24px 48px rgba(15, 42, 109, 0.12)',
    padding: '32px',
  },
  logoImage: {
    width: '66px',
    height: '66px',
    objectFit: 'contain',
    display: 'block',
    margin: '0 auto 14px',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  formTitle: {
    fontSize: '34px',
    fontWeight: '700',
    color: '#102a63',
    letterSpacing: 0,
    textTransform: 'uppercase',
    margin: '0 0 10px',
  },
  formDesc: {
    color: '#6981a8',
    fontSize: '15px',
    margin: 0,
    fontWeight: '400',
    letterSpacing: 0,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fff5f5',
    border: '1px solid #fdd5d5',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '20px',
    color: '#dc2626',
    fontSize: '13px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#5f7599',
    letterSpacing: '0.7px',
    textTransform: 'uppercase',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '13px 14px 13px 42px',
    border: '1.5px solid #d7e0ef',
    borderRadius: '12px',
    fontSize: '15px',
    color: '#0f1f43',
    backgroundColor: '#f7faff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    transition: 'all 0.2s ease',
  },
  submitBtn: {
    marginTop: '10px',
    padding: '14px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #15337f 0%, #2458da 100%)',
    color: 'white',
    fontWeight: '600',
    fontSize: '16px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 22px rgba(30,79,207,0.28)',
    letterSpacing: 0,
    width: '100%',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};
