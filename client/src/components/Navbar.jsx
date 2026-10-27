import { useState } from 'react';
import { Search, Shield, Bell, CheckCircle2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [navSearch, setNavSearch] = useState('');

  const pageMeta = {
    '/dashboard': {
      title: 'Dashboard',
      subtitle: 'Overview of your encrypted vault and documents',
    },
    '/documents': {
      title: 'My Documents',
      subtitle: 'Manage, share, and version your encrypted documents',
    },
    '/shared': {
      title: 'Shared With Me',
      subtitle: 'Documents shared with you with granted permissions',
    },
    '/folders': {
      title: 'Folders',
      subtitle: 'Organize documents into structured folders',
    },
  };

  const currentMeta = pageMeta[location.pathname] || {
    title: 'SecureDocs',
    subtitle: 'Secure Document Management & Collaboration',
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (navSearch.trim()) {
      navigate(`/documents?search=${encodeURIComponent(navSearch.trim())}`);
    } else {
      navigate('/documents');
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-page-info">
          <h1>{currentMeta.title}</h1>
          <p>{currentMeta.subtitle}</p>
        </div>
      </div>

      <div className="navbar-right">
        {/* Interactive Global Search Form */}
        <form className="navbar-search-form" onSubmit={handleSearchSubmit}>
          <Search size={17} className="navbar-search-icon" />
          <input
            type="text"
            placeholder="Search documents (Press Enter)..."
            aria-label="Search documents"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
          />
        </form>

        

        {/* Notification Bell */}
        <button
          className="notification-button"
          type="button"
          title="Notifications (System status: All services operational)"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="notification-dot"></span>
        </button>

        {/* User Identity */}
        <div className="navbar-user">
          <div className="navbar-avatar" title={user?.name || 'User'}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="navbar-user-info">
            <strong>{user?.name || 'User'}</strong>
            <span>{user?.email || ''}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;