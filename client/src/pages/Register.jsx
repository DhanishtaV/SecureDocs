import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, User, Eye, EyeOff, ArrowRight, Share2, History } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
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

    if (!formData.name.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          <h2>Create Your Encrypted Document Vault</h2>
          <p>
            Join SecureDocs to store, manage, and collaborate on sensitive documents with
            military-grade encryption and full version audits.
          </p>

          <div className="security-features-list">
            <div className="security-feature-item">
              <div className="feature-icon-box">
                <Lock size={18} />
              </div>
              <div>
                <strong>Zero-Knowledge Encryption</strong>
                <span>Files are encrypted using AES-256-GCM before writing to the storage volume.</span>
              </div>
            </div>

            <div className="security-feature-item">
              <div className="feature-icon-box">
                <Share2 size={18} />
              </div>
              <div>
                <strong>Multi-Tiered Access</strong>
                <span>Assign Owner, Editor, or Viewer roles with real-time revocation.</span>
              </div>
            </div>

            <div className="security-feature-item">
              <div className="feature-icon-box">
                <History size={18} />
              </div>
              <div>
                <strong>Non-Destructive Revisioning</strong>
                <span>Upload updates and restore past versions without overwriting historical records.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="brand-footer-note">
          <div className="status-indicator-dot"></div>
          <span>Secure Platform • Authenticated File Vault Active</span>
        </div>
      </div>

      {/* Registration Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="form-header">
            <div className="mobile-brand-header">
              <ShieldCheck size={24} className="mobile-logo-icon" />
              <span>SecureDocs</span>
            </div>
            <h2>Create your account</h2>
            <p>Start collaborating securely with verified access controls.</p>
          </div>

          {error && (
            <div className="auth-alert error-alert" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <User size={18} className="input-icon" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Alex Morgan"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="email">Work Email</label>
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
              <label htmlFor="password">Password (min. 6 characters)</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
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

            <div className="input-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-spinner-wrap">
                  <span className="spinner-sm"></span> Creating Account...
                </span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-switch-prompt">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;