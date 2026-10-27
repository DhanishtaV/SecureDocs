import {
  LayoutDashboard,
  FileText,
  Share2,
  Folder,
  LogOut,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'My Documents',
      path: '/documents',
      icon: FileText,
    },
    {
      name: 'Shared With Me',
      path: '/shared',
      icon: Share2,
    },
    {
      name: 'Folders',
      path: '/folders',
      icon: Folder,
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <ShieldCheck size={22} />
        </div>

        <div className="logo-text-group">
          <h2>SecureDocs</h2>
          <span>Document Vault</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">NAVIGATION</p>

        {navigationItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      
      <div className="sidebar-bottom">
        <div className="user-profile">
          <div className="user-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>

          <div className="user-info">
            <strong>{user?.name || 'User'}</strong>
            <span title={user?.email || ''}>{user?.email || ''}</span>
          </div>
        </div>

        <button
          className="logout-button"
          onClick={logout}
          title="Sign out of SecureDocs"
          type="button"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;