import { Outlet } from 'react-router-dom';

const AuthLayout = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
      <Outlet />
    </div>
  </div>
);

export default AuthLayout;
