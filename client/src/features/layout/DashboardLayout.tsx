import { Outlet } from 'react-router-dom';
import Navbar from '../../shared/ui/Navbar';
import Sidebar from '../../shared/ui/Sidebar';

const DashboardLayout = () => (
  <div className="min-h-screen bg-slate-100">
    <Navbar />
    <div className="flex pt-16">
      <Sidebar />
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
