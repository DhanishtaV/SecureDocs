import { useEffect, useState } from 'react';
import {
  Upload,
  X,
  FileText,
  Folder,
} from 'lucide-react';
import {
  uploadDocument,
  getFolders,
} from '../services/api';

const UploadModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [folderId, setFolderId] = useState('');
  const [folders, setFolders] = useState([]);

  const [loadingFolders, setLoadingFolders] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const data = await getFolders();

        setFolders(
          Array.isArray(data)
            ? data
            : data.folders || []
        );
      } catch (err) {
        console.error('Folder loading error:', err);
      } finally {
        setLoadingFolders(false);
      }
    };

    loadFolders();
  }, []);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    setError('');

    // Backend limit is 10 MB.
    if (selectedFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError(
        'File size must be 10 MB or less.'
      );
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please select a file.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const formData = new FormData();

      formData.append('file', file);

      if (folderId) {
        formData.append('folderId', folderId);
      }

      console.log('Selected folder ID:', folderId);
console.log('Available folders:', folders);

      await uploadDocument(formData);

      onSuccess();
    } catch (err) {
      console.error('Upload error:', err);

      setError(
        err.message ||
          'Unable to upload document.'
      );
    } finally {
      setUploading(false);
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
            <h3>Upload Document</h3>
            <p>
              Add a document to your SecureDocs
              workspace.
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={uploading}
          >
            <X size={19} />
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <label
            htmlFor="document-file"
            className={`file-drop-zone ${
              file ? 'has-file' : ''
            }`}
          >
            <input
              id="document-file"
              type="file"
              onChange={handleFileChange}
              hidden
              disabled={uploading}
            />

            {file ? (
              <>
                <div className="file-selected-icon">
                  <FileText size={25} />
                </div>

                <strong>
                  {file.name}
                </strong>

                <span>
                  {(file.size / 1024 / 1024).toFixed(
                    2
                  )}{' '}
                  MB
                </span>
              </>
            ) : (
              <>
                <div className="upload-icon">
                  <Upload size={25} />
                </div>

                <strong>
                  Click to select a file
                </strong>

                <span>
                  Maximum file size: 10 MB
                </span>
              </>
            )}
          </label>

          <div className="form-group modal-form-group">
            <label htmlFor="folder">
              <Folder size={15} />
              Folder
            </label>

            <select
              id="folder"
              value={folderId}
              onChange={(event) =>
                setFolderId(event.target.value)
              }
              disabled={
                loadingFolders || uploading
              }
            >
              <option value="">
                No folder (Root)
              </option>

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
              disabled={uploading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                uploading || !file
              }
            >
              <Upload size={17} />

              {uploading
                ? 'Uploading...'
                : 'Upload Document'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
};

export default UploadModal;