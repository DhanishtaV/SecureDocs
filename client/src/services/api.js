const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Common API request helper
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
  };

  // Add JSON content type only when sending normal JSON data.
  // Do NOT add it for FormData uploads.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle file/blob responses
  if (options.responseType === 'blob') {
    if (!response.ok) {
      let errorMessage = 'Download failed';

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // Response was not JSON
      }

      throw new Error(errorMessage);
    }

    return response.blob();
  }

  let data = null;

  try {
    data = await response.json();
  } catch {
    // Some successful requests may not return JSON
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  return data;
};

// -------------------------
// Authentication
// -------------------------

export const registerUser = (userData) =>
  apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const loginUser = (userData) =>
  apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const getCurrentUser = () =>
  apiRequest('/auth/me');

// -------------------------
// Folders
// -------------------------

export const getFolders = () =>
  apiRequest('/folders');

export const createFolder = (name) =>
  apiRequest('/folders', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

export const deleteFolder = (folderId) =>
  apiRequest(`/folders/${folderId}`, {
    method: 'DELETE',
  });

// -------------------------
// Documents
// -------------------------

export const getDocuments = (search = '') => {
  const query = search && search.trim()
    ? `/search?q=${encodeURIComponent(search.trim())}`
    : '';

  return apiRequest(`/documents${query}`);
};

export const uploadDocument = (formData) =>
  apiRequest('/documents/upload', {
    method: 'POST',
    body: formData,
  });

export const downloadDocument = (documentId) =>
  apiRequest(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });

export const deleteDocument = (documentId) =>
  apiRequest(`/documents/${documentId}`, {
    method: 'DELETE',
  });

export const moveDocument = (documentId, folderId) =>
  apiRequest(`/documents/${documentId}/move`, {
    method: 'PUT',
    body: JSON.stringify({ folderId }),
  });

// -------------------------
// Sharing
// -------------------------

export const shareDocument = (documentId, userData) =>
  apiRequest(`/documents/${documentId}/share`, {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const getDocumentShares = (documentId) =>
  apiRequest(`/documents/${documentId}/shares`);

export const updateDocumentShare = (documentId, userId, role) =>
  apiRequest(`/documents/${documentId}/share/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });

export const removeDocumentShare = (documentId, userId) =>
  apiRequest(`/documents/${documentId}/share/${userId}`, {
    method: 'DELETE',
  });

// -------------------------
// Version History
// -------------------------

export const getDocumentVersions = (documentId) =>
  apiRequest(`/documents/${documentId}/versions`);

export const uploadDocumentVersion = (documentId, formData) =>
  apiRequest(`/documents/${documentId}/versions`, {
    method: 'POST',
    body: formData,
  });

export const downloadDocumentVersion = (documentId, versionNumber) =>
  apiRequest(
    `/documents/${documentId}/versions/${versionNumber}/download`,
    {
      responseType: 'blob',
    }
  );

export const restoreDocumentVersion = (documentId, versionNumber) =>
  apiRequest(
    `/documents/${documentId}/versions/${versionNumber}/restore`,
    {
      method: 'POST',
    }
  );

export default apiRequest;