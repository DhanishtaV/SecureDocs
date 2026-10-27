import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Navbar from './Navbar';
const Layout = () => {
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;