import { useEffect, useState } from 'react';
import {
  History,
  X,
  Download,
  RotateCcw,
  Upload,
  FileText,
  Clock,
  User,
  CheckCircle,
} from 'lucide-react';
import {
  getDocumentVersions,
  downloadDocumentVersion,
  uploadDocumentVersion,
  restoreDocumentVersion,
} from '../services/api';

const VersionHistoryModal = ({ document, userRole = 'viewer', onClose, onSuccess }) => {
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(document?.currentVersion || 1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [actionLoadingVersion, setActionLoadingVersion] = useState(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [versionFile, setVersionFile] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const docId = document?._id || document?.id;
  const canModifyVersions = userRole === 'owner' || userRole === 'editor';

  const loadVersions = async () => {
    if (!docId) return;
    try {
      setLoading(true);
      setError('');
      const data = await getDocumentVersions(docId);
      const list = Array.isArray(data) ? data : data.versions || [];
      setVersions(list);
      if (data.currentVersion) {
        setCurrentVersion(data.currentVersion);
      }
    } catch (err) {
      console.error('Error fetching version history:', err);
      setError(err.message || 'Unable to load version history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [docId]);

  const handleDownloadVersion = async (versionNumber, filename) => {
    try {
      setActionLoadingVersion(`dl-${versionNumber}`);
      setError('');

      const blob = await downloadDocumentVersion(docId, versionNumber);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement('a');

      link.href = url;
      link.download = filename || `document-v${versionNumber}`;
      window.document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download version error:', err);
      setError(err.message || `Unable to download version ${versionNumber}.`);
    } finally {
      setActionLoadingVersion(null);
    }
  };

  const handleUploadVersion = async (e) => {
    e.preventDefault();
    if (!versionFile) {
      setError('Please select a file to upload as the new version.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccessMessage('');

      const formData = new FormData();
      formData.append('file', versionFile);

      const res = await uploadDocumentVersion(docId, formData);
      setSuccessMessage(`New version (${res.currentVersion || 'latest'}) uploaded successfully.`);
      setVersionFile(null);
      setShowUploadForm(false);

      await loadVersions();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Upload version error:', err);
      setError(err.message || 'Unable to upload new version.');
    } finally {
      setUploading(false);
    }
  };

  const handleRestoreVersion = async (versionNumber) => {
    const confirmed = window.confirm(
      `Restore Version ${versionNumber}? A new current version will be created from this copy.`
    );
    if (!confirmed) return;

    try {
      setActionLoadingVersion(`res-${versionNumber}`);
      setError('');
      setSuccessMessage('');

      const res = await restoreDocumentVersion(docId, versionNumber);
      setSuccessMessage(
        res.message || `Version ${versionNumber} restored successfully as Version ${res.currentVersion}.`
      );

      await loadVersions();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Restore version error:', err);
      setError(err.message || `Unable to restore version ${versionNumber}.`);
    } finally {
      setActionLoadingVersion(null);
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
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="modal-card" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div>
            <h3>Version History</h3>
            <p>
              Timeline for <strong>{document?.originalName || document?.name || 'this document'}</strong>
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

        {error && <div className="error-message">{error}</div>}
        {successMessage && (
          <div
            style={{
              padding: '10px 14px',
              marginBottom: '16px',
              borderRadius: '8px',
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              fontSize: '13px',
            }}
          >
            {successMessage}
          </div>
        )}

        {/* Upload New Version Button for Owner / Editor */}
        {canModifyVersions && (
          <div style={{ marginBottom: '20px' }}>
            {!showUploadForm ? (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowUploadForm(true)}
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
              >
                <Upload size={16} />
                Upload New Version
              </button>
            ) : (
              <form
                onSubmit={handleUploadVersion}
                style={{
                  padding: '16px',
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>Upload New Version</strong>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setVersionFile(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && f.size > 10 * 1024 * 1024) {
                      setError('File size must be 10 MB or less.');
                      return;
                    }
                    setError('');
                    setVersionFile(f || null);
                  }}
                  disabled={uploading}
                  style={{ fontSize: '13px', marginBottom: '12px', width: '100%' }}
                />

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowUploadForm(false);
                      setVersionFile(null);
                    }}
                    disabled={uploading}
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={uploading || !versionFile}
                    style={{ padding: '6px 14px', fontSize: '12px' }}
                  >
                    {uploading ? 'Encrypting & Uploading...' : 'Upload Version'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Version List */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              borderBottom: '1px solid #e2e8f0',
              paddingBottom: '8px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
              All Versions ({versions.length})
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Current Version: <strong style={{ color: '#2563eb' }}>v{currentVersion}</strong>
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '28px', color: '#64748b', fontSize: '13px' }}>
              Loading version timeline...
            </div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', background: '#f8fafc', borderRadius: '8px', color: '#64748b' }}>
              No version history recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '320px', overflowY: 'auto' }}>
              {versions.map((ver) => {
                const isCurrent = ver.versionNumber === currentVersion;
                const isDlLoading = actionLoadingVersion === `dl-${ver.versionNumber}`;
                const isResLoading = actionLoadingVersion === `res-${ver.versionNumber}`;

                return (
                  <div
                    key={ver.versionNumber}
                    style={{
                      padding: '14px',
                      background: isCurrent ? '#f0f9ff' : '#ffffff',
                      borderRadius: '10px',
                      border: isCurrent ? '1.5px solid #60a5fa' : '1px solid #e2e8f0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            background: isCurrent ? '#2563eb' : '#e2e8f0',
                            color: isCurrent ? '#ffffff' : '#334155',
                            fontWeight: '700',
                            borderRadius: '6px',
                            fontSize: '11px',
                          }}
                        >
                          v{ver.versionNumber}
                        </span>

                        <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                          {ver.originalName || 'Untitled'}
                        </strong>

                        {isCurrent && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: '#16a34a',
                              fontWeight: '600',
                              background: '#dcfce7',
                              padding: '2px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            <CheckCircle size={12} /> Current
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleDownloadVersion(ver.versionNumber, ver.originalName)}
                          disabled={isDlLoading}
                          title="Download this version"
                          className="secondary-button"
                          style={{ padding: '5px 9px', fontSize: '12px', height: '30px' }}
                        >
                          <Download size={14} />
                          {isDlLoading ? '...' : 'Download'}
                        </button>

                        {canModifyVersions && !isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleRestoreVersion(ver.versionNumber)}
                            disabled={isResLoading}
                            title="Restore this version"
                            className="primary-button"
                            style={{ padding: '5px 9px', fontSize: '12px', height: '30px', background: '#0f172a' }}
                          >
                            <RotateCcw size={14} />
                            {isResLoading ? '...' : 'Restore'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: '#64748b' }}>
                      <span>Size: {formatBytes(ver.fileSize)}</span>
                      <span>•</span>
                      <span>By: {ver.uploadedBy?.name || 'User'}</span>
                      <span>•</span>
                      <span>{formatDate(ver.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: '20px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
