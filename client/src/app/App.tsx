import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../features/layout/DashboardLayout';
import AuthLayout from '../features/layout/AuthLayout';
import LoginPage from '../features/auth/LoginPage';
import RegisterPage from '../features/auth/RegisterPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import { CampaignsPage } from '../features/campaigns';
import { RuleBuilderPage } from '../features/rules';
import ProtectedRoute from '../features/layout/ProtectedRoute';
import HomePage from '../features/home/HomePage';
import PricingPage from '../features/home/PricingPage';
import AdAccountsPage from '../features/dashboard/AdAccountsPage';
import AdSetsPage from '../features/campaigns/AdSetsPage';
import AdsPage from '../features/campaigns/AdsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="accounts" element={<AdAccountsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="rules/builder" element={<RuleBuilderPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="adsets/:campaignId" element={<AdSetsPage />} />
        <Route path="ads/:adSquadId" element={<AdsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}

export default App;
