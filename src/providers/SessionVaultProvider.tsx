import { AuthResult } from '@ionic-enterprise/auth';
import { createContext, PropsWithChildren } from 'react';
import {
  BrowserVault,
  DeviceSecurityType,
  IdentityVaultConfig,
  Vault,
  VaultType,
} from '@ionic-enterprise/identity-vault';
import { isPlatform } from '@ionic/react';

const createVault = (config: IdentityVaultConfig): Vault | BrowserVault => {
  return isPlatform('hybrid') ? new Vault(config) : new BrowserVault(config);
};

const key = 'auth-result';
const vault = createVault({
  key: 'io.ionic.gettingstartedacreact',
  type: VaultType.SecureStorage,
  deviceSecurityType: DeviceSecurityType.None,
  lockAfterBackgrounded: 5000,
  shouldClearVaultAfterTooManyFailedAttempts: true,
  customPasscodeInvalidUnlockAttempts: 2,
  unlockVaultOnLoad: false,
});

export const SessionVaultContext = createContext<{
  clearSession: () => Promise<void>;
  getSession: () => Promise<AuthResult | null>;
  setSession: (value?: AuthResult) => Promise<void>;
}>({
  clearSession: () => {
    throw new Error('Method not implemented.');
  },
  getSession: () => {
    throw new Error('Method not implemented.');
  },
  setSession: () => {
    throw new Error('Method not implemented.');
  },
});

export const SessionVaultProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const clearSession = (): Promise<void> => {
    return vault.clear();
  };

  const getSession = (): Promise<AuthResult | null> => {
    return vault.getValue<AuthResult>(key);
  };

  const setSession = (value?: AuthResult): Promise<void> => {
    return vault.setValue(key, value);
  };

  return (
    <SessionVaultContext.Provider value={{ clearSession, getSession, setSession }}>
      {children}
    </SessionVaultContext.Provider>
  );
};
