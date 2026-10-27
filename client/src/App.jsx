import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import FoldersPage from './pages/FoldersPage';
import SharedDocuments from './pages/SharedDocuments';


const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/folders" element={<FoldersPage />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/shared" element={<SharedDocuments />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
};

export default App;