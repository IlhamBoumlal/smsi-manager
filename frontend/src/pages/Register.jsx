import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, getHoldings, getSocietes } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    nomComplet: '',
    email: '',
    holdingId: '',
    societeId: '',
    password: '',
    confirmPassword: ''
  });
  const [holdings, setHoldings] = useState([]);
  const [societes, setSocietes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getHoldings().then(r => setHoldings(r.data));
    getSocietes().then(r => setSocietes(r.data));
  }, []);

  const handleHoldingChange = async (e) => {
    const holdingId = e.target.value;
    setForm({ ...form, holdingId, societeId: '' });
    const res = await getSocietes(holdingId || null);
    setSocietes(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await register({
        ...form,
        holdingId: form.holdingId ? parseInt(form.holdingId) : null,
        societeId: parseInt(form.societeId)
      });
      loginUser(res.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data || "Erreur lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* ── Left panel ── */}
      <div style={styles.leftPanel}>
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
        <div style={styles.bgCircle1} />
        <div style={styles.bgCircle2} />
      </div>

      {/* ── Right panel ── */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          {/* Logo above title */}
          <div style={styles.formHeader}>
            <img src="/iso-logo.png" alt="ISO 27001" style={{ width: '60px', height: '60px', objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
            <h2 style={styles.formTitle}>Inscription</h2>
            <p style={styles.formDesc}>Rejoignez votre organisation sur SMSI Manager</p>
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

            {/* Row 1 */}
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Nom complet</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="#94a3b8" strokeWidth="1.5" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input type="text" placeholder="Prénom et nom" style={styles.input}
                    onChange={e => setForm({ ...form, nomComplet: e.target.value })} required />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Adresse email</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                      <path d="M3 9l9 6 9-6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input type="email" placeholder="votre@email.com" style={styles.input}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
            </div>

            {/* Row 2 */}
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>
                  Holding
                  <span style={styles.optionalTag}>optionnel</span>
                </label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="7" width="20" height="14" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                      <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="#94a3b8" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <select value={form.holdingId} onChange={handleHoldingChange}
                    style={{ ...styles.input, ...styles.select }}>
                    <option value="">— Sélectionner —</option>
                    {holdings.map(h => <option key={h.id} value={h.id}>{h.nom}</option>)}
                  </select>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Société</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                      <path d="M3 9h18M9 21V9" stroke="#94a3b8" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <select value={form.societeId}
                    onChange={e => setForm({ ...form, societeId: e.target.value })}
                    style={{ ...styles.input, ...styles.select }} required>
                    <option value="">— Sélectionner —</option>
                    {societes.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 3 */}
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Mot de passe</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                      <path d="M8 11V7a4 4 0 018 0v4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                    style={{ ...styles.input, paddingRight: '44px' }}
                    onChange={e => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <EyeIcon show={showPassword} />
                  </button>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Confirmer le mot de passe</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
                      <path d="M8 11V7a4 4 0 018 0v4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </span>
                  <input type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                    style={{ ...styles.input, paddingRight: '44px' }}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    <EyeIcon show={showConfirm} />
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.submitBtn}>
              <span style={styles.btnContent}>
                {loading ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    Création du compte…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="1.8" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M19 8v6M16 11h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Créer mon compte
                  </>
                )}
              </span>
            </button>
          </form>

          <p style={styles.switchText}>
            Déjà un compte ?{' '}
            <Link to="/login" style={styles.link}>Se connecter</Link>
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

function EyeIcon({ show }) {
  return show ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20C7 20 2.73 16.11 1 12c.812-1.95 2.1-3.67 3.72-4.99M9.9 4.24A9.12 9.12 0 0112 4c5 0 9.27 3.89 11 8a10.22 10.22 0 01-2.65 4.24M3 3l18 18" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="#94a3b8" strokeWidth="1.5" />
    </svg>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    backgroundColor: '#f8fafc',
  },
  leftPanel: {
    width: '420px',
    flexShrink: 0,
    background: 'linear-gradient(160deg, #0b1f4a 0%, #163380 55%, #1e4fcf 100%)',
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
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
    margin: '0 0 10px',
  },
  brandSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: '13px',
    lineHeight: '1.7',
    margin: 0,
    fontWeight: '400',
  },
  dividerLine: {
    width: '36px',
    height: '1px',
    background: 'rgba(255,255,255,0.2)',
    margin: '28px auto',
  },
  normeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    letterSpacing: '0.4px',
    margin: 0,
  },
  bgCircle1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.03)',
    top: '-160px',
    right: '-200px',
  },
  bgCircle2: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.03)',
    bottom: '-120px',
    left: '-120px',
  },
  rightPanel: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px',
    overflowY: 'auto',
  },
  formCard: {
    width: '100%',
    maxWidth: '640px',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  formTitle: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: '2px',
    textTransform: 'uppercase',
    margin: '0 0 8px',
  },
  formDesc: {
    color: '#94a3b8',
    fontSize: '13px',
    margin: 0,
    fontWeight: '400',
    letterSpacing: '0.2px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
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
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  optionalTag: {
    fontSize: '10px',
    color: '#94a3b8',
    fontWeight: '500',
    background: '#f1f5f9',
    borderRadius: '4px',
    padding: '1px 6px',
    textTransform: 'none',
    letterSpacing: '0.2px',
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
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outline: 'none',
    boxSizing: 'border-box',
    appearance: 'none',
  },
  select: {
    cursor: 'pointer',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 14px center',
    paddingRight: '38px',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  },
  submitBtn: {
    marginTop: '6px',
    padding: '13px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #163380, #1e4fcf)',
    color: 'white',
    fontWeight: '600',
    fontSize: '14px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(30,79,207,0.28)',
    letterSpacing: '0.3px',
    width: '100%',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '13px',
    color: '#94a3b8',
    marginTop: '24px',
  },
  link: {
    color: '#1e4fcf',
    fontWeight: '600',
    textDecoration: 'none',
  },
};