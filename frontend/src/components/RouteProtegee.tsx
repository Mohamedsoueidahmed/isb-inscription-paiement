import { Navigate } from 'react-router-dom';
import { estConnecte } from '../services/auth.service';

interface Props {
  children: React.ReactNode;
}

export default function RouteProtegee({ children }: Props) {
  if (!estConnecte()) {
    return <Navigate to="/connexion" replace />;
  }

  return <>{children}</>;
}
