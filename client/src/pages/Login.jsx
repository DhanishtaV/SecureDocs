import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, FileText, Share2, History, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Visual Identity / Security Showcase Panel */}
      <div className="auth-brand-panel">
        <div className="brand-header">
          <div className="brand-logo-icon">
            <ShieldCheck size={28} />
          </div>
          <div className="brand-title-wrap">
            <h1 className="brand-title">SecureDocs</h1>
            <span className="brand-badge">AES-256-GCM Encrypted</span>
          </div>
        </div>

        <div className="brand-hero-content">
          <h2>Enterprise Document Security & Granular Collaboration</h2>
          <p>
            Zero-knowledge file encryption at rest, role-based document access control,
            and tamper-evident version history built for teams.
          </p>

          <div className="security-features-list">
            <div className="security-feature-item">
              <div className="feature-icon-box">
                <Lock size={18} />
              </div>
              <div>
                <strong>AES-256-GCM Encryption</strong>
                <span>Files are encrypted at rest with authenticated Galois/Counter Mode.</span>
              </div>
            </div>

            <div className="security-feature-item">
              <div className="feature-icon-box">
                <Share2 size={18} />
              </div>
              <div>
                <strong>Role-Based Access Control</strong>
                <span>Strict Owner, Editor, and Viewer permission boundaries enforced on every action.</span>
              </div>
            </div>

            <div className="security-feature-item">
              <div className="feature-icon-box">
                <History size={18} />
              </div>
              <div>
                <strong>Version History & Instant Restore</strong>
                <span>Preserve every revision with cryptographic metadata and roll back instantly.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-footer-note">
          <div className="status-indicator-dot"></div>
          <span>Secure Platform • Authenticated File Vault Active</span>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="form-header">
            <div className="mobile-brand-header">
              <ShieldCheck size={24} className="mobile-logo-icon" />
              <span>SecureDocs</span>
            </div>
            <h2>Sign in to your account</h2>
            <p>Enter your credentials to access your encrypted document vault.</p>
          </div>

          {error && (
            <div className="auth-alert error-alert" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="input-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@organization.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner-sm"></span> Signing In...
                </span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch-prompt">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;