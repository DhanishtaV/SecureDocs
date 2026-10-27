import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder,
  Plus,
  Trash2,
  FileText,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  X,
} from 'lucide-react';
import {
  getFolders,
  createFolder,
  deleteFolder,
  getDocuments,
} from '../services/api';
import ConfirmModal from '../components/ConfirmModal';

const FoldersPage = () => {
  const navigate = useNavigate();

  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [folderName, setFolderName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [foldersData, documentsData] = await Promise.all([
        getFolders(),
        getDocuments(),
      ]);

      setFolders(
        Array.isArray(foldersData)
          ? foldersData
          : foldersData.folders || []
      );

      setDocuments(
        Array.isArray(documentsData)
          ? documentsData
          : documentsData.documents || []
      );
    } catch (err) {
      console.error('Folder loading error:', err);
      setError(err.message || 'Unable to load folders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getFolderDocumentCount = (folderId) => {
    return documents.filter((document) => {
      const documentFolder =
        document.folder?._id ||
        document.folder?.id ||
        document.folder;

      return documentFolder === folderId;
    }).length;
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = folderName.trim();

    if (!name) {
      setError('Please enter a folder name.');
      return;
    }

    try {
      setCreating(true);
      setError('');

      const data = await createFolder(name);
      const newFolder = data.folder || data;

      setFolders((current) => [...current, newFolder]);
      setFolderName('');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Create folder error:', err);
      setError(err.message || 'Unable to create folder.');
    } finally {
      setCreating(false);
    }
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    const fId = folderToDelete._id || folderToDelete.id;

    try {
      setDeletingId(fId);
      setError('');

      await deleteFolder(fId);

      setFolders((current) =>
        current.filter((item) => (item._id || item.id) !== fId)
      );

      setFolderToDelete(null);
      await loadData();
    } catch (err) {
      console.error('Delete folder error:', err);
      setError(err.message || 'Unable to delete folder.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (date) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="page-shell">
      {/* Title Bar */}
      <div className="page-title-bar">
        <div>
          <h2>Folder Directories</h2>
          <p>Organize your encrypted documents into structured directories.</p>
        </div>

        <div className="title-bar-actions">
          <button
            type="button"
            className="btn-refresh"
            onClick={loadData}
            disabled={loading}
            title="Refresh folders"
          >
            <RefreshCw size={17} className={loading ? 'spinning' : ''} />
          </button>

          <button
            type="button"
            className="btn-primary-action"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert error-alert" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* Folders Grid */}
      {loading ? (
        <div className="page-loading-state">
          <div className="spinner-md"></div>
          <p>Loading folder structure...</p>
        </div>
      ) : folders.length === 0 ? (
        <div className="empty-vault-state">
          <div className="empty-icon-circle">
            <Folder size={40} />
          </div>
          <h4>No folders created yet</h4>
          <p>Create folders to group related documents and simplify access control.</p>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            <span>Create First Folder</span>
          </button>
        </div>
      ) : (
        <div className="folders-card-grid">
          {folders.map((folder) => {
            const fId = folder._id || folder.id;
            const docCount = getFolderDocumentCount(fId);

            return (
              <div className="folder-card-tile" key={fId}>
                <div className="folder-tile-top">
                  <div className="folder-icon-box">
                    <FolderOpen size={24} />
                  </div>

                  <button
                    type="button"
                    className="btn-folder-delete"
                    onClick={() => setFolderToDelete(folder)}
                    title="Delete folder"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="folder-tile-main">
                  <h3 className="folder-name-heading" title={folder.name}>
                    {folder.name}
                  </h3>
                  <div className="folder-stats-meta">
                    <span className="doc-count-tag">
                      <FileText size={13} />
                      <span>{docCount} {docCount === 1 ? 'document' : 'documents'}</span>
                    </span>
                    <span className="folder-created-date">
                      Created {formatDate(folder.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="folder-tile-footer">
                  <button
                    type="button"
                    className="btn-open-folder"
                    onClick={() => navigate('/documents')}
                  >
                    <span>View Documents</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-container folder-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-title">
                <Folder size={20} className="modal-header-icon" />
                <h3>Create New Folder</h3>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="modal-body-form">
              <div className="input-group">
                <label htmlFor="folderName">Folder Name</label>
                <input
                  id="folderName"
                  type="text"
                  placeholder="e.g. Legal Contracts, Finance Reports"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={creating || !folderName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Folder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Confirm Modal */}
      <ConfirmModal
        isOpen={Boolean(folderToDelete)}
        title="Delete Folder"
        message={`Are you sure you want to delete "${folderToDelete?.name}"? Any documents currently inside this folder will be unfiled to the root level.`}
        confirmText="Delete Folder"
        confirmVariant="danger"
        loading={Boolean(deletingId)}
        onConfirm={confirmDeleteFolder}
        onClose={() => setFolderToDelete(null)}
      />
    </div>
  );
};

export default FoldersPage;