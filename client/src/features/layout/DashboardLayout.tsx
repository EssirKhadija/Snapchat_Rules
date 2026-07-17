import { Outlet } from 'react-router-dom';
import Navbar from '../../shared/ui/Navbar';
import Sidebar from '../../shared/ui/Sidebar';

const DashboardLayout = () => (
  <div className="min-h-screen bg-snap-bg">
    <Navbar />
    <div className="flex pt-14">
      <Sidebar />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  </div>
);

export default DashboardLayout;
