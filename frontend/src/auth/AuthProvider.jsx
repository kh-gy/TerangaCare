import { useEffect, useMemo, useState } from 'react';
import { AuthContext } from './authContext';
import { authTokenKey, fetchCurrentUser, getApiBaseUrl, isAuthDisabled, loginWithCredentials, registerWithCredentials } from './authApi';

export const AuthProvider = ({ children }) => {
  const [initialized, setInitialized] = useState(() => isAuthDisabled() || !localStorage.getItem(authTokenKey));
  const [authenticated, setAuthenticated] = useState(() => isAuthDisabled());
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(() => (isAuthDisabled() ? 'dev-access-token' : localStorage.getItem(authTokenKey)));

  useEffect(() => {
    if (isAuthDisabled()) {
      setAuthenticated(true);
      setProfile({
        sub: 'dev-auth-user',
        email: 'dev@terangacare.local',
        given_name: 'Teranga',
        family_name: 'Care',
        preferred_username: 'dev',
        roles: ['administrateur'],
      });
      setInitialized(true);
      return undefined;
    }

    let active = true;

    if (!accessToken) {
      return undefined;
    }

    fetchCurrentUser(accessToken)
      .then((currentUser) => {
        if (!active) {
          return;
        }

        setAuthenticated(true);
        setProfile(currentUser);
        setInitialized(true);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        localStorage.removeItem(authTokenKey);
        setAccessToken(null);
        setAuthenticated(false);
        setProfile(null);
        setInitialized(true);
      });

    return () => {
      active = false;
    };
  }, [accessToken]);

  const login = async ({ email, password }) => {
    const payload = await loginWithCredentials(email, password);
    const nextToken = payload.access_token;

    if (!isAuthDisabled()) {
      localStorage.setItem(authTokenKey, nextToken);
    }
    setAccessToken(nextToken);
    setAuthenticated(true);
    setProfile(payload.user ?? null);
    setError(null);

    return payload;
  };

  const register = async ({ email, password, firstName, lastName, role }) => {
    const payload = await registerWithCredentials({ email, password, firstName, lastName, role });
    setError(null);
    return payload;
  };

  const logout = () => {
    if (!isAuthDisabled()) {
      localStorage.removeItem(authTokenKey);
    }
    setAccessToken(null);
    setAuthenticated(false);
    setProfile(null);
    setError(null);
    return Promise.resolve();
  };

  const value = useMemo(
    () => ({
      authenticated,
      error,
      initialized,
      isConfigured: Boolean(getApiBaseUrl()),
      isAuthDisabled: isAuthDisabled(),
      login,
      logout,
      profile,
      register,
      accessToken,
    }),
    [accessToken, authenticated, error, initialized, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};