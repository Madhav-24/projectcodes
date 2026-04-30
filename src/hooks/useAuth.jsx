// Module: useAuth
// Purpose: Convenience hook to access auth context from any component.

import { useAuthContext } from '../context/AuthContext.jsx';

export function useAuth() {
  return useAuthContext();
}
