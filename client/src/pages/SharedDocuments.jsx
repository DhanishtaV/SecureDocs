import { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  History,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { getDocuments, downloadDocument } from '../services/api';
import VersionHistoryModal from '../modals/VersionHistoryModal';

const SharedDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState('');

  const [activeDocument, setActiveDocument] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const loadSharedDocuments = async (searchValue = '') => {
    try {
      setLoading(true);
      setError('');

      const data = await getDocuments(searchValue);
      const documentList = Array.isArray(data) ? data : data.documents || [];

      // Filter to documents where role is NOT owner (meaning shared with this user)
      const sharedOnly = documentList.filter((doc) => doc.role && doc.role !== 'owner');

      setDocuments(sharedOnly);
    } catch (err) {
      console.error('Shared documents loading error:', err);
      setError(err.message || 'Unable to load shared documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedDocuments();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();
    await loadSharedDocuments(search);
  };

  const handleDownload = async (document) => {
    const docId = document._id || document.id;
    try {
      setDownloadingId(docId);
      setError('');

      const blob = await downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = url;
      link.download = document.originalName || document.name || 'shared-document';

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

  const formatBytes = (bytes) => {
    const size = Number(bytes) || 0;
    if (size === 0) return '0 Bytes';
    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(size) / Math.log(1024));
    return `${(size / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
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

  return (
    <div className="documents-page">
      {/* Page Header */}
      <div className="page-heading">
        <div>
          <h2>Shared With Me</h2>
          <p>Documents shared with you by other collaborators.</p>
        </div>
      </div>

      {/* Search */}
      <div className="documents-toolbar">
        <form className="document-search" onSubmit={handleSearch}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search shared documents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        <button
          type="button"
          className="refresh-button"
          onClick={() => loadSharedDocuments(search)}
          disabled={loading}
          title="Refresh"
        >
          <RefreshCw size={17} className={loading ? 'spin-icon' : ''} />
        </button>
      </div>

      {/* Error */}
      {error && <div className="error-message">{error}</div>}

      {/* Documents Card */}
      <div className="documents-card">
        <div className="documents-card-header">
          <div>
            <h3>Shared Documents</h3>
            <span>
              {documents.length} {documents.length === 1 ? 'document' : 'documents'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <div className="loading-spinner"></div>
            <p>Loading shared documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <Share2 size={44} />
            <h4>No documents have been shared with you</h4>
            <p>When someone shares a document with your email, it will appear here.</p>
          </div>
        ) : (
          <div className="documents-table-wrapper">
            <table className="documents-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Permission</th>
                  <th>Version</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((document) => {
                  const docId = document._id || document.id;
                  const role = document.role || 'viewer';

                  return (
                    <tr key={docId}>
                      <td>
                        <div className="table-document">
                          <div className="document-icon">
                            <FileText size={19} />
                          </div>

                          <div>
                            <strong>{document.originalName || document.name || 'Untitled'}</strong>
                            {document.folder?.name && <span>{document.folder.name}</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="file-type">{getFileExtension(document)}</span>
                      </td>

                      <td>{formatBytes(document.fileSize)}</td>

                      <td>
                        <span className={`role-badge role-${role}`}>
                          {role.toUpperCase()}
                        </span>
                      </td>

                      <td>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#475569',
                          }}
                        >
                          v{document.currentVersion || 1}
                        </span>
                      </td>

                      <td>{formatDate(document.updatedAt || document.createdAt)}</td>

                      <td>
                        <div className="document-actions">
                          <button
                            type="button"
                            title="Download"
                            onClick={() => handleDownload(document)}
                            disabled={downloadingId === docId}
                          >
                            <Download size={17} />
                          </button>

                          <button
                            type="button"
                            title="Version History"
                            onClick={() => {
                              setActiveDocument(document);
                              setShowHistoryModal(true);
                            }}
                          >
                            <History size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Version History Modal */}
      {showHistoryModal && activeDocument && (
        <VersionHistoryModal
          document={activeDocument}
          userRole={activeDocument.role || 'viewer'}
          onClose={() => {
            setShowHistoryModal(false);
            setActiveDocument(null);
          }}
          onSuccess={async () => {
            await loadSharedDocuments(search);
          }}
        />
      )}
    </div>
  );
};

export default SharedDocuments;
