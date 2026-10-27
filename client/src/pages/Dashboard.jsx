import { useEffect, useState } from 'react';
import {
  FileText,
  Folder,
  Share2,
  HardDrive,
  Upload,
  Plus,
  ArrowRight,
  Shield,
  Clock,
  Download,
  Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, getFolders, downloadDocument } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [documentsData, foldersData] = await Promise.all([
          getDocuments(),
          getFolders(),
        ]);

        setDocuments(
          Array.isArray(documentsData)
            ? documentsData
            : documentsData.documents || []
        );

        setFolders(
          Array.isArray(foldersData)
            ? foldersData
            : foldersData.folders || []
        );
      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError(err.message || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getRole = (document) => {
    return document.role || 'owner';
  };

  const sharedDocuments = documents.filter(
    (document) => getRole(document) !== 'owner'
  );

  const storageUsed = documents.reduce(
    (total, document) => total + (Number(document.fileSize) || 0),
    0
  );

  const formatBytes = (bytes) => {
    if (!bytes) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getFileExtension = (document) => {
    const filename = document.originalName || document.name || '';
    const parts = filename.split('.');
    if (parts.length < 2) return 'FILE';
    return parts.pop().toUpperCase();
  };

  const handleDownload = async (document) => {
    const docId = document._id || document.id;
    try {
      setDownloadingId(docId);
      const blob = await downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.originalName || document.name || 'document';
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Unable to download document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const recentDocuments = [...documents]
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt) -
        new Date(a.updatedAt || a.createdAt)
    )
    .slice(0, 5);

  if (loading) {
    return (
      <div className="page-loading-state">
        <div className="spinner-lg"></div>
        <p>Loading your secure vault...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="hero-text-content">
          <div className="hero-status-tag">
            <Shield size={14} />
            <span>Vault Protected & Encrypted</span>
          </div>
          <h2>Document Security Overview</h2>
          <p>
            Monitor storage volume, access boundaries, and latest document revisions across your organization.
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="btn-primary-action"
            onClick={() => navigate('/documents')}
            type="button"
          >
            <Upload size={17} />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert error-alert" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Real Statistics Grid */}
      <div className="stats-metric-grid">
        <div className="metric-card">
          <div className="metric-icon-box blue">
            <FileText size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Documents</span>
            <strong className="metric-value">{documents.length}</strong>
            <span className="metric-subtext">Active files in vault</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box purple">
            <Share2 size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Shared With Me</span>
            <strong className="metric-value">{sharedDocuments.length}</strong>
            <span className="metric-subtext">Collaborator access</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box emerald">
            <Folder size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">My Folders</span>
            <strong className="metric-value">{folders.length}</strong>
            <span className="metric-subtext">Organized directories</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-box amber">
            <HardDrive size={22} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Storage Consumed</span>
            <strong className="metric-value">{formatBytes(storageUsed)}</strong>
            <span className="metric-subtext">AES-256-GCM encrypted</span>
          </div>
        </div>
      </div>

      {/* Quick Access Actions */}
      <div className="quick-access-section">
        <div className="section-title-wrap">
          <h3>Quick Operations</h3>
          <p>Direct actions to organize and secure documents.</p>
        </div>

        <div className="quick-cards-grid">
          <button
            className="quick-action-tile"
            onClick={() => navigate('/documents')}
            type="button"
          >
            <div className="tile-icon-box">
              <Upload size={20} />
            </div>
            <div className="tile-content">
              <strong>Upload New Document</strong>
              <span>Encrypt and store files into root or folders</span>
            </div>
            <ArrowRight size={18} className="tile-arrow" />
          </button>

          <button
            className="quick-action-tile"
            onClick={() => navigate('/folders')}
            type="button"
          >
            <div className="tile-icon-box">
              <Plus size={20} />
            </div>
            <div className="tile-content">
              <strong>Create Folder</strong>
              <span>Organize related document files</span>
            </div>
            <ArrowRight size={18} className="tile-arrow" />
          </button>

          <button
            className="quick-action-tile"
            onClick={() => navigate('/shared')}
            type="button"
          >
            <div className="tile-icon-box">
              <Share2 size={20} />
            </div>
            <div className="tile-content">
              <strong>Review Shared Documents</strong>
              <span>Access files delegated by team members</span>
            </div>
            <ArrowRight size={18} className="tile-arrow" />
          </button>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div className="recent-documents-section">
        <div className="section-header-row">
          <div>
            <h3>Recent Documents</h3>
            <p>Recently uploaded or updated documents in your vault.</p>
          </div>

          {documents.length > 0 && (
            <button
              className="view-all-link"
              onClick={() => navigate('/documents')}
              type="button"
            >
              <span>View all documents</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="recent-table-card">
          {recentDocuments.length === 0 ? (
            <div className="empty-vault-state">
              <div className="empty-icon-circle">
                <FileText size={36} />
              </div>
              <h4>No documents uploaded yet</h4>
              <p>Upload your first document to begin encrypting and organizing your vault.</p>
              <button
                className="btn-primary-action"
                onClick={() => navigate('/documents')}
                type="button"
              >
                <Upload size={17} />
                <span>Upload Document</span>
              </button>
            </div>
          ) : (
            <div className="recent-items-list">
              {recentDocuments.map((doc) => {
                const docId = doc._id || doc.id;
                const role = getRole(doc);
                const ext = getFileExtension(doc);
                const isDownloading = downloadingId === docId;

                return (
                  <div className="recent-item-row" key={docId}>
                    <div className="item-file-info">
                      <div className="file-badge-box">
                        <span className="file-ext-label">{ext}</span>
                      </div>

                      <div className="file-name-meta">
                        <strong className="file-title">
                          {doc.originalName || doc.name || 'Untitled Document'}
                        </strong>
                        <div className="file-sub-meta">
                          <span>{formatBytes(Number(doc.fileSize) || 0)}</span>
                          <span className="meta-separator">•</span>
                          <span>v{doc.currentVersion || 1}</span>
                          <span className="meta-separator">•</span>
                          <span>{formatDate(doc.updatedAt || doc.createdAt)}</span>
                          {doc.folder && (
                            <>
                              <span className="meta-separator">•</span>
                              <span className="folder-crumb">📁 {doc.folder.name || 'Folder'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="item-action-area">
                      <span className={`role-pill role-${role}`}>
                        {role === 'owner' ? 'Owner' : role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>

                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => handleDownload(doc)}
                        disabled={isDownloading}
                        title="Download decrypted document"
                      >
                        <Download size={16} />
                        <span>{isDownloading ? 'Decrypting...' : 'Download'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;