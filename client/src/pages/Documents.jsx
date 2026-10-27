import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import UploadModal from '../modals/uploadModal';
import MoveModal from '../modals/MoveModal';
import ShareModal from '../modals/ShareModal';
import VersionHistoryModal from '../modals/VersionHistoryModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  FileText,
  Download,
  Trash2,
  Search,
  Upload,
  Share2,
  History,
  FolderInput,
  RefreshCw,
  Folder,
  X,
  Filter,
} from 'lucide-react';
import {
  getDocuments,
  downloadDocument,
  deleteDocument,
  getFolders,
} from '../services/api';

const Documents = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';

  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [search, setSearch] = useState(initialQuery);
  const [selectedFolderFilter, setSelectedFolderFilter] = useState('ALL');

  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeDocument, setActiveDocument] = useState(null);
  const [activeModal, setActiveModal] = useState(''); // 'move' | 'share' | 'versions'

  // Confirm delete dialog state
  const [docToDelete, setDocToDelete] = useState(null);

  const loadDocuments = async (searchValue = '') => {
    try {
      setLoading(true);
      setError('');

      const [docsData, foldersData] = await Promise.all([
        getDocuments(searchValue),
        getFolders(),
      ]);

      const documentList = Array.isArray(docsData)
        ? docsData
        : docsData.documents || [];

      setDocuments(documentList);

      const folderList = Array.isArray(foldersData)
        ? foldersData
        : foldersData.folders || [];
      setFolders(folderList);
    } catch (err) {
      console.error('Documents loading error:', err);
      setError(err.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
    loadDocuments(q);
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setSearchParams({ search: search.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchParams({});
  };

  const handleDownload = async (doc) => {
    const docId = doc._id || doc.id;
    try {
      setDownloadingId(docId);
      setError('');

      const blob = await downloadDocument(docId);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = url;
      link.download = doc.originalName || doc.name || 'document';
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

  const confirmDeleteAction = async () => {
    if (!docToDelete) return;
    const docId = docToDelete._id || docToDelete.id;

    try {
      setDeletingId(docId);
      setError('');

      await deleteDocument(docId);

      setDocuments((prev) =>
        prev.filter((item) => (item._id || item.id) !== docId)
      );
      setDocToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'Unable to delete document.');
    } finally {
      setDeletingId(null);
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

  const getRole = (doc) => {
    return doc.role || 'owner';
  };

  const getFileExtension = (doc) => {
    const filename = doc.originalName || doc.name || '';
    const parts = filename.split('.');
    if (parts.length < 2) return 'FILE';
    return parts.pop().toUpperCase();
  };

  // Filtered documents by folder
  const filteredDocuments = documents.filter((doc) => {
    if (selectedFolderFilter === 'ALL') return true;
    if (selectedFolderFilter === 'ROOT') return !doc.folder;
    const docFolderId = doc.folder?._id || doc.folder?.id || doc.folder;
    return docFolderId === selectedFolderFilter;
  });

  return (
    <div className="page-shell">
      {/* Page Action Header */}
      <div className="page-title-bar">
        <div>
          <h2>Document Repository</h2>
          <p>Search, manage, share, and version your encrypted documents.</p>
        </div>

        <div className="title-bar-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={() => loadDocuments(search)}
            disabled={loading}
            title="Refresh repository"
          >
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={() => setShowUploadModal(true)}
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

      {/* Filter and Search Bar */}
      <div className="table-controls-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-wrap">
          <Search size={18} className="search-field-icon" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </form>

        <div className="folder-filter-wrap">
          <Filter size={16} className="filter-icon" />
          <select
            value={selectedFolderFilter}
            onChange={(e) => setSelectedFolderFilter(e.target.value)}
            className="folder-filter-select"
            aria-label="Filter documents by folder"
          >
            <option value="ALL">All Folders ({documents.length})</option>
            <option value="ROOT">Unfiled / Root</option>
            {folders.map((f) => {
              const fId = f._id || f.id;
              return (
                <option key={fId} value={fId}>
                  📁 {f.name}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Main Documents Table Card */}
      <div className="data-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="spinner-md"></div>
            <p>Decrypting and fetching documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-vault-state">
            <div className="empty-icon-circle">
              <FileText size={38} />
            </div>
            <h4>
              {search || selectedFolderFilter !== 'ALL'
                ? 'No documents matched your criteria'
                : 'No documents in this repository yet'}
            </h4>
            <p>
              {search || selectedFolderFilter !== 'ALL'
                ? 'Try adjusting your search query or folder filter.'
                : 'Upload your first document to store it with AES-256-GCM encryption.'}
            </p>
            {search || selectedFolderFilter !== 'ALL' ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  handleClearSearch();
                  setSelectedFolderFilter('ALL');
                }}
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary-action"
                onClick={() => setShowUploadModal(true)}
              >
                <Upload size={17} />
                <span>Upload Document</span>
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Folder</th>
                  <th>Size</th>
                  <th>Version</th>
                  <th>Access Role</th>
                  <th>Last Modified</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => {
                  const docId = doc._id || doc.id;
                  const role = getRole(doc);
                  const isOwner = role === 'owner';
                  const isEditor = role === 'editor';
                  const isDownloading = downloadingId === docId;
                  const isDeleting = deletingId === docId;
                  const ext = getFileExtension(doc);

                  return (
                    <tr key={docId} className="table-row">
                      <td className="doc-primary-cell">
                        <div className="doc-icon-badge">
                          <span className="doc-ext-text">{ext}</span>
                        </div>
                        <div className="doc-meta-title">
                          <strong className="table-doc-name" title={doc.originalName || doc.name}>
                            {doc.originalName || doc.name || 'Untitled Document'}
                          </strong>
                          <span className="doc-security-subtext">AES-256-GCM Encrypted</span>
                        </div>
                      </td>

                      <td>
                        {doc.folder ? (
                          <span className="folder-tag">
                            <Folder size={14} />
                            <span>{doc.folder.name || 'Folder'}</span>
                          </span>
                        ) : (
                          <span className="unfiled-tag">Unfiled (Root)</span>
                        )}
                      </td>

                      <td className="doc-size-cell">{formatBytes(doc.fileSize)}</td>

                      <td>
                        <span className="version-pill" title={`Current version: v${doc.currentVersion || 1}`}>
                          v{doc.currentVersion || 1}
                        </span>
                      </td>

                      <td>
                        <span className={`role-pill role-${role}`}>
                          {isOwner ? 'Owner' : isEditor ? 'Editor' : 'Viewer'}
                        </span>
                      </td>

                      <td className="doc-date-cell">
                        {formatDate(doc.updatedAt || doc.createdAt)}
                      </td>

                      <td className="text-right actions-cell">
                        <div className="row-action-buttons">
                          {/* Download decrypted */}
                          <button
                            type="button"
                            className="btn-row-action"
                            onClick={() => handleDownload(doc)}
                            disabled={isDownloading}
                            title="Download decrypted document"
                          >
                            <Download size={16} />
                          </button>

                          {/* Version History Modal */}
                          <button
                            type="button"
                            className="btn-row-action"
                            onClick={() => {
                              setActiveDocument(doc);
                              setActiveModal('versions');
                            }}
                            title="View version history & restore"
                          >
                            <History size={16} />
                          </button>

                          {/* Move to folder (Owner only) */}
                          {isOwner && (
                            <button
                              type="button"
                              className="btn-row-action"
                              onClick={() => {
                                setActiveDocument(doc);
                                setActiveModal('move');
                              }}
                              title="Move to another folder"
                            >
                              <FolderInput size={16} />
                            </button>
                          )}

                          {/* Share with users (Owner only) */}
                          {isOwner && (
                            <button
                              type="button"
                              className="btn-row-action"
                              onClick={() => {
                                setActiveDocument(doc);
                                setActiveModal('share');
                              }}
                              title="Share with collaborators"
                            >
                              <Share2 size={16} />
                            </button>
                          )}

                          {/* Delete Document (Owner only) */}
                          {isOwner && (
                            <button
                              type="button"
                              className="btn-row-action danger-action"
                              onClick={() => setDocToDelete(doc)}
                              disabled={isDeleting}
                              title="Delete document"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
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

      {/* Modals */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadDocuments(search);
          }}
        />
      )}

      {activeModal === 'move' && activeDocument && (
        <MoveModal
          document={activeDocument}
          onClose={() => {
            setActiveModal('');
            setActiveDocument(null);
          }}
          onSuccess={() => {
            setActiveModal('');
            setActiveDocument(null);
            loadDocuments(search);
          }}
        />
      )}

      {activeModal === 'share' && activeDocument && (
        <ShareModal
          document={activeDocument}
          onClose={() => {
            setActiveModal('');
            setActiveDocument(null);
          }}
          onSuccess={() => {
            setActiveModal('');
            setActiveDocument(null);
            loadDocuments(search);
          }}
        />
      )}

      {activeModal === 'versions' && activeDocument && (
        <VersionHistoryModal
  document={activeDocument}
  userRole={getRole(activeDocument)}
          onClose={() => {
            setActiveModal('');
            setActiveDocument(null);
          }}
          onSuccess={() => {
            loadDocuments(search);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(docToDelete)}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${
          docToDelete?.originalName || docToDelete?.name || 'this document'
        }"? All version history and encrypted files will be permanently removed.`}
        confirmText="Delete Document"
        confirmVariant="danger"
        loading={Boolean(deletingId)}
        onConfirm={confirmDeleteAction}
        onClose={() => setDocToDelete(null)}
      />
    </div>
  );
};

export default Documents;