import { Auth0Provider, AuthConnect, AuthResult, ProviderOptions, TokenType } from '@ionic-enterprise/auth';
import { isPlatform } from '@ionic/react';
import { PropsWithChildren, createContext, useState, useEffect, useContext } from 'react';
import { SessionVaultContext } from './SessionVaultProvider';

const isNative = isPlatform('hybrid');

const options: ProviderOptions = {
  audience: import.meta.env.VITE_AUDIENCE,
  clientId: import.meta.env.VITE_CLIENTID,
  discoveryUrl: import.meta.env.VITE_DISCOVERYURL,
  logoutUrl: isNative ? import.meta.env.VITE_LOGOUTURLMOBILE : import.meta.env.VITE_LOGOUTURLWEB,
  redirectUri: isNative ? import.meta.env.VITE_REDIRECTURIMOBILE : import.meta.env.VITE_REDIRECTURIWEB,
  scope: import.meta.env.VITE_SCOPE,
};

const setupAuthConnect = async (): Promise<void> => {
  return AuthConnect.setup({
    platform: isNative ? 'capacitor' : 'web',
    logLevel: 'DEBUG',
    ios: { webView: 'private' },
    web: { uiMode: 'popup', authFlow: 'implicit' },
  });
};

const provider = new Auth0Provider();

export const AuthContext = createContext<{
  isAuthenticated: boolean;
  getAccessToken: () => Promise<string | undefined>;
  getUserName: () => Promise<string | undefined>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}>({
  isAuthenticated: false,
  getAccessToken: () => {
    throw new Error('Method not implemented.');
  },
  getUserName: () => {
    throw new Error('Method not implemented.');
  },
  login: () => {
    throw new Error('Method not implemented.');
  },
  logout: () => {
    throw new Error('Method not implemented.');
  },
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const { clearSession, getSession, setSession } = useContext(SessionVaultContext);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const saveAuthResult = async (authResult: AuthResult | null): Promise<void> => {
    if (authResult) {
      await setSession(authResult);
      setIsAuthenticated(true);
    } else {
      await clearSession();
      setIsAuthenticated(false);
    }
  };

  const refreshAuth = async (authResult: AuthResult): Promise<AuthResult | null> => {
    let newAuthResult: AuthResult | null = null;

    if (await AuthConnect.isRefreshTokenAvailable(authResult)) {
      try {
        newAuthResult = await AuthConnect.refreshSession(provider, authResult);
      } catch (err) {
        console.log('Error refreshing session.', err);
      }
    }

    return newAuthResult;
  };

  const getAuthResult = async (): Promise<AuthResult | null> => {
    let authResult = await getSession();

    if (authResult && (await AuthConnect.isAccessTokenExpired(authResult))) {
      const newAuthResult = await refreshAuth(authResult);
      saveAuthResult(newAuthResult);
    }
    setIsAuthenticated(!!authResult);
    return authResult;
  };

  useEffect(() => {
    setupAuthConnect().then(() => setIsSetup(true));
  }, []);

  const getAccessToken = async (): Promise<string | undefined> => {
    const res = await getAuthResult();
    return res?.accessToken;
  };

  const getUserName = async (): Promise<string | undefined> => {
    const res = await getAuthResult();
    if (res) {
      const data = await AuthConnect.decodeToken<{ name: string }>(TokenType.id, res);
      return data?.name;
    }
  };

  const login = async (): Promise<void> => {
    const authResult = await AuthConnect.login(provider, options);
    await saveAuthResult(authResult);
  };

  const logout = async (): Promise<void> => {
    const authResult = await getAuthResult();
    if (authResult) {
      await AuthConnect.logout(provider, authResult);
      await saveAuthResult(null);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, getAccessToken, getUserName, login, logout }}>
      {isSetup && children}
    </AuthContext.Provider>
  );
};
