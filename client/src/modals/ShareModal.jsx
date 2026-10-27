import { useEffect, useState } from 'react';
import { Share2, X, UserPlus, Trash2, Shield, Eye, Edit3 } from 'lucide-react';
import {
  getDocumentShares,
  shareDocument,
  updateDocumentShare,
  removeDocumentShare,
} from '../services/api';

const ShareModal = ({ document, onClose, onSuccess }) => {
  const [shares, setShares] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');

  const [loadingShares, setLoadingShares] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const docId = document?._id || document?.id;

  const loadShares = async () => {
    if (!docId) return;
    try {
      setLoadingShares(true);
      setError('');
      const data = await getDocumentShares(docId);
      const list = Array.isArray(data) ? data : data.shares || [];
      setShares(list);
    } catch (err) {
      console.error('Error fetching document shares:', err);
      setError(err.message || 'Unable to load shared users.');
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    loadShares();
  }, [docId]);

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();

    if (!targetEmail) {
      setError('Please enter a user email.');
      return;
    }

    try {
      setSharing(true);
      setError('');
      setSuccessMessage('');

      await shareDocument(docId, { email: targetEmail, role });

      setSuccessMessage(`Document shared with ${targetEmail} as ${role}.`);
      setEmail('');
      setRole('viewer');

      await loadShares();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Share error:', err);
      setError(err.message || 'Unable to share document.');
    } finally {
      setSharing(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setActionLoadingId(userId);
      setError('');
      setSuccessMessage('');

      await updateDocumentShare(docId, userId, newRole);
      setSuccessMessage('Permissions updated successfully.');
      await loadShares();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Update share error:', err);
      setError(err.message || 'Unable to update user role.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemoveShare = async (userId, userEmail) => {
    const confirmed = window.confirm(
      `Remove access for ${userEmail || 'this user'}?`
    );
    if (!confirmed) return;

    try {
      setActionLoadingId(userId);
      setError('');
      setSuccessMessage('');

      await removeDocumentShare(docId, userId);
      setSuccessMessage('User access removed.');
      await loadShares();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Remove share error:', err);
      setError(err.message || 'Unable to remove user access.');
    } finally {
      setActionLoadingId(null);
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
      <div className="modal-card" style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div>
            <h3>Share Document</h3>
            <p>
              Manage collaboration for{' '}
              <strong>{document?.originalName || document?.name || 'this document'}</strong>
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={sharing}
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

        {/* Add User Section */}
        <form onSubmit={handleShareSubmit} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, margin: 0 }}>
              <label htmlFor="share-email" style={{ fontSize: '12px', fontWeight: '600' }}>
                User Email
              </label>
              <input
                id="share-email"
                type="email"
                placeholder="collaborator@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sharing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
            </div>

            <div className="form-group" style={{ flex: 1, margin: 0 }}>
              <label htmlFor="share-role" style={{ fontSize: '12px', fontWeight: '600' }}>
                Role
              </label>
              <select
                id="share-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={sharing}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#fff',
                }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={sharing || !email.trim()}
              style={{ padding: '10px 16px', height: '40px' }}
            >
              <UserPlus size={16} />
              {sharing ? 'Sharing...' : 'Invite'}
            </button>
          </div>
        </form>

        {/* Existing Shares List */}
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
              People with access ({shares.length})
            </span>
          </div>

          {loadingShares ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>
              Loading permissions...
            </div>
          ) : shares.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                background: '#f8fafc',
                borderRadius: '8px',
                color: '#64748b',
                fontSize: '13px',
              }}
            >
              This document is not shared with anyone yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {shares.map((share) => {
                const targetUserId = share.user?.id || share.user?._id;
                const isActionLoading = actionLoadingId === targetUserId;

                return (
                  <div
                    key={share.id || share._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                        {share.user?.name || 'User'}
                      </strong>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {share.user?.email || ''}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={share.role}
                        onChange={(e) => handleRoleChange(targetUserId, e.target.value)}
                        disabled={isActionLoading}
                        style={{
                          padding: '6px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '12px',
                          background: '#ffffff',
                          fontWeight: '600',
                          color: share.role === 'editor' ? '#2563eb' : '#0f172a',
                        }}
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleRemoveShare(targetUserId, share.user?.email)}
                        disabled={isActionLoading}
                        title="Remove Access"
                        style={{
                          width: '30px',
                          height: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#fee2e2',
                          border: 'none',
                          borderRadius: '6px',
                          color: '#dc2626',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ marginTop: '24px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
