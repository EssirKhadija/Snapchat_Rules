import { Navigate } from 'react-router-dom';
import { useAuth } from '../../shared/lib/auth';

interface Props {
  children: JSX.Element;
}

const ProtectedRoute = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

export default ProtectedRoute;
