import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../features/layout/DashboardLayout';
import AuthLayout from '../features/layout/AuthLayout';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import { CampaignsPage } from '../features/campaigns';
import { RuleBuilderPage } from '../features/rules';
import ProtectedRoute from '../features/layout/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="rules/builder" element={<RuleBuilderPage/>} />
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default App;
