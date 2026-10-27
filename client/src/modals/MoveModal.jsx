import { useEffect, useState } from 'react';
import { Folder, FolderInput, X } from 'lucide-react';
import { getFolders, moveDocument } from '../services/api';

const MoveModal = ({ document, onClose, onSuccess }) => {
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState('');

  const docId = document?._id || document?.id;
  const currentFolderName =
    document?.folder && typeof document.folder === 'object'
      ? document.folder.name
      : document?.folder
      ? folders.find((f) => (f._id || f.id) === document.folder)?.name || 'Assigned Folder'
      : 'No folder (Root)';

  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true);
        const data = await getFolders();
        const list = Array.isArray(data) ? data : data.folders || [];
        setFolders(list);

        // Pre-select current folder if any
        const initialFolderId =
          document?.folder && typeof document.folder === 'object'
            ? document.folder._id || document.folder.id
            : document?.folder || '';
        setSelectedFolderId(initialFolderId || '');
      } catch (err) {
        console.error('Error loading folders for move:', err);
        setError('Unable to load folders.');
      } finally {
        setLoadingFolders(false);
      }
    };

    loadFolders();
  }, [document]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docId) {
      setError('Invalid document ID.');
      return;
    }

    try {
      setMoving(true);
      setError('');

      // Pass null if root/empty is selected
      const targetFolder = selectedFolderId ? selectedFolderId : null;
      await moveDocument(docId, targetFolder);

      onSuccess();
    } catch (err) {
      console.error('Move document error:', err);
      setError(err.message || 'Unable to move document.');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h3>Move Document</h3>
            <p>
              Move <strong>{document?.originalName || document?.name || 'this document'}</strong> to a new folder.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={moving}
          >
            <X size={19} />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px', fontSize: '13px', color: '#64748b' }}>
            Current location:{' '}
            <span style={{ color: '#0f172a', fontWeight: '600' }}>{currentFolderName}</span>
          </div>

          <div className="form-group modal-form-group" style={{ marginTop: '0' }}>
            <label htmlFor="target-folder">
              <Folder size={15} />
              Target Folder
            </label>

            <select
              id="target-folder"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              disabled={loadingFolders || moving}
            >
              <option value="">No folder (Root)</option>
              {folders.map((folder) => {
                const fId = folder._id || folder.id;
                return (
                  <option key={fId} value={fId}>
                    {folder.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={moving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={moving || loadingFolders}
            >
              <FolderInput size={17} />
              {moving ? 'Moving...' : 'Move Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MoveModal;
