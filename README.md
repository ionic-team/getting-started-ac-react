# Getting Started with Auth Connect in @ionic/react

In this tutorial we will walk through the basic setup and use of Ionic's Auth Connect in an `@ionic/react` application.

In this tutorial, you will learn how to:

- Install and configure Auth Connect
- Perform Login and Logout operations
- Check if the user is authenticated
- Obtain the tokens from Auth Connect
- Integrate Identity Vault with Auth Connect

:::note
The source code for the Ionic application created in this tutorial can be found [here](https://github.com/ionic-team/getting-started-ac-react)
:::

## Generate the Application

The first step to take is to generate the application:

```bash
ionic start getting-started-ac-react tabs --type=react
```

Now that the application has been generated, let's also add the iOS and Android platforms.

Open the `capacitor.config.ts` file and change the `appId` to something unique like `io.ionic.gettingstartedacreact`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.gettingstartedacreact',
  appName: 'getting-started-ac-react',
  webDir: 'build',
  server: {
    androidScheme: 'https',
  },
};

export default config;
```

Next, open `index.tsx` and remove React's strict mode. Your root should only render `<App />` like so:

```tsx
...
const container = document.getElementById("root");
const root = createRoot(container!);
root.render(<App />);
...
```

Then, build the application, then install and create the platforms:

```bash
npm run build
ionic cap add android
ionic cap add ios
```

Finally, in order to ensure that a `cap sync` is run with each build, add it to the build script in the `package.json` file as such:

```json
"scripts": {
  "build": "tsc && vite build && cap sync",
  ...
},
```

## Install Auth Connect

In order to install Auth Connect, you will need to use `ionic enterprise register` to register your product key. This will create a `.npmrc` file containing the product key.

If you have already performed that step for your production application, you can just copy the `.npmrc` file from your production project. Since this application is for learning purposes only, you don't need to obtain another key.

You can now install Auth Connect and sync the platforms:

```bash
npm install @ionic-enterprise/auth
```

## Configure Auth Connect

Our next step is to configure Auth Connect. Create a file named `src/providers/AuthProvider.tsx` and fill it with the following boilerplate content:

```tsx
import { ProviderOptions } from '@ionic-enterprise/auth';
import { isPlatform } from '@ionic/react';
import { PropsWithChildren, createContext } from 'react';

const isNative = isPlatform('hybrid');

const options: ProviderOptions = {
  clientId: '',
  discoveryUrl: '',
  scope: 'openid offline_access',
  audience: '',
  redirectUri: isNative ? '' : '',
  logoutUrl: isNative ? '' : '',
};

export const AuthContext = createContext<{}>({});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};
```

Open `src/App.tsx` and wrap `IonReactRouter` with the provider:

```tsx
...
import { AuthProvider } from './providers/AuthProvider';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <AuthProvider>
      <IonReactRouter>
        ...
      </IonReactRouter>
    </AuthProvider>
  </IonApp>
);
```

### Auth Connect Options

The `options` object is passed to the `login()` function when we establish the authentication session. As you can see, there are several items that we need to fill in. Specifically: `audience`, `clientId`, `scope`, `discoveryUrl`, `redirectUri`, and `logoutUrl`.

Obtaining this information likely takes a little coordination with whoever administers our backend services. In our case, we have a team that administers our Auth0 services and they have given us the following information:

- Application ID: `yLasZNUGkZ19DGEjTmAITBfGXzqbvd00`
- Audience: `https://io.ionic.demo.ac`
- Metadata Document URL: `https://dev-2uspt-sz.us.auth0.com/.well-known/openid-configuration`
- Web Redirect (for development): `http://localhost:8100/login`
- Native Redirect (for development): `msauth://login`
- Additional Scopes: `email picture profile`

Translating that into our configuration object, we now have this:

```typescript
const options: ProviderOptions = {
  audience: 'https://io.ionic.demo.ac',
  clientId: 'yLasZNUGkZ19DGEjTmAITBfGXzqbvd00',
  discoveryUrl: 'https://dev-2uspt-sz.us.auth0.com/.well-known/openid-configuration',
  logoutUrl: isNative ? 'msauth://login' : 'http://localhost:8100/login',
  redirectUri: isNative ? 'msauth://login' : 'http://localhost:8100/login',
  scope: 'openid offline_access email picture profile',
};
```

The web redirect for development is on port `8100`. Vite uses port `5173` by default, so we will need to make a minor change to our `package.json` file as well:

```json
"scripts": {
    "dev": "vite --port=8100",
    ...
},
```

**Note:** you can use your own configuration for this tutorial as well. However, we suggest that you start with our configuration, get the application working, and then try your own configuration after that.

### Initialization

Before we can use any `AuthConnect` functions we need to make sure we have performed the initialization. Add the code to do this after the setting of the `options` value in `src/providers/AuthProvider.tsx`.

```tsx
import { AuthConnect, ProviderOptions } from '@ionic-enterprise/auth';
import { isPlatform } from '@ionic/react';
import { PropsWithChildren, createContext, useState, useEffect } from 'react';

const isNative = isPlatform('hybrid');

const options: ProviderOptions = {
  // see the options setting above
};

const setupAuthConnect = async (): Promise<void> => {
  return AuthConnect.setup({
    platform: isNative ? 'capacitor' : 'web',
    logLevel: 'DEBUG',
    ios: { webView: 'private' },
    web: { uiMode: 'popup', authFlow: 'implicit' },
  });
};

export const AuthContext = createContext<{}>({});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isSetup, setIsSetup] = useState<boolean>(false);

  useEffect(() => {
    setupAuthConnect().then(() => setIsSetup(true));
  }, []);

  return <AuthContext.Provider value={{}}>{isSetup && children}</AuthContext.Provider>;
};
```

This will get Auth Connect ready to use within our application. Notice that this is also where we supply any platform specific Auth Connect options. Right now, `logLevel` is set to `DEBUG` since this is a demo application. In a production environment, we probably would set it to `DEBUG` in development and `ERROR` in production.

The `isSetup` state variable ensures the setup is complete before we make any further `AuthConnect` calls.

### The Provider

Auth Connect requires a provider object that specifies details pertaining to communicating with the OIDC service. Auth Connect offers several common providers out of the box: `Auth0Provider`, `AzureProvider`, `CognitoProvider`, `OktaProvider`, and `OneLoginProvider`. You can also create your own provider, though doing so is beyond the scope of this tutorial.

:::note
While they share the same name, providers bundled with Auth Connect **are not** React Context Providers like the one we're building in this guide. "Providers" from an Auth Connect perspective refers to _Authentication Providers_.
:::

Since we are using Auth0, we will create an `Auth0Provider`:

```typescript
import { AuthConnect, Auth0Provider, ProviderOptions } from '@ionic-enterprise/auth';
import { isPlatform } from '@ionic/react';
import { PropsWithChildren, createContext, useState, useEffect } from 'react';
...
const provider = new Auth0Provider();

export const AuthContext = createContext<{}>({});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  ...
};
```

### Login and Logout

Login and logout are the two most fundamental operations in the authentication flow.

For the `login()`, we need to pass both the `provider` and the `options` established above. The `login()` call resolves an `AuthResult` if the operation succeeds. The `AuthResult` contains the auth tokens as well as some other information. This object needs to be passed to almost all other `Auth Connect` functions. As such, it needs to be saved.

The `login()` call rejects with an error if the user cancels the login or if something else prevents the login to complete.

Add the following code to `src/providers/AuthProvider.tsx`:

```tsx
...
export const AuthContext = createContext<{
  login: () => Promise<void>;
}>({
  login: () => { throw new Error("Method not implemented."); }
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [isSetup, setIsSetup] = useState<boolean>(false);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);

  ...

  const login = async (): Promise<void> => {
    const authResult = await AuthConnect.login(provider, options);
    setAuthResult(authResult);
  };

  return <AuthContext.Provider value={{ login }}>{isSetup && children}</AuthContext.Provider>;
};
```

For the logout operation, we pass the `provider` and the `authResult` that was returned by the `login()` call.

```tsx
...
export const AuthContext = createContext<{
  ...
  logout: () => Promise<void>;
}>({
  ...
  logout: () => { throw new Error("Method not implemented."); },
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  ...

  const logout = async (): Promise<void> => {
    if (authResult) {
      await AuthConnect.logout(provider, authResult);
      setAuthResult(null);
    }
  };

  return <AuthContext.Provider value={{ login, logout }}>{isSetup && children}</AuthContext.Provider>;
};
```

To test these new functions, replace the `ExploreContainer` with "Login" and "Logout" buttons in the `src/pages/Tab1.tsx` file:

```tsx
...
import { useContext } from "react";
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { AuthContext } from "../providers/AuthProvider";
import "./Tab1.css";

const Tab1: React.FC = () => {
  const { login, logout } = useContext(AuthContext);

  return (
    <IonPage>
      <IonHeader>
        ...
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          ...
        </IonHeader>
        <IonButton onClick={login}>Login</IonButton>
        <IonButton onClick={logout}>Logout</IonButton>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
```

If you are using our Auth0 provider, you can use the following credentials for the test:

- Email Address: `test@ionic.io`
- Password: `Ion54321`

You should be able to login and logout successfully.

### Configure the Native Projects

Build the application for a native device and try the login there as well. You should notice that this does not work on your device.

The problem is that we need to let the native device know which application(s) are allowed to handle navigation to the `msauth://` scheme (if you are using our Auth0 Provider). To do this, we need to modify our `build.gradle` and `Info.plist` files as [noted here](https://ionic.io/docs/auth-connect/install). If you are using our Auth0 Provider, use `msauth` in place of `$AUTH_URL_SCHEME`.

### Determine Current Auth Status

Right now, the user is shown both the login and logout buttons but you don't really know if the user is logged in or not. Let's change that.

A simple strategy to use is tracking the status using state, updating the value after calling certain Auth Connect API methods. Add code to do this in `src/providers/AuthProvider.tsx`. Ignore the extra complexity with the `getAuthResult()` function -- we will expand on that as we go.

```tsx
...
export const AuthContext = createContext<{
  isAuthenticated: boolean;
  ...
}>({
  isAuthenticated: false,
  ...
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  ...
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const getAuthResult = async (): Promise<AuthResult | null> => {
    setIsAuthenticated(!!authResult);
    return authResult;
  };

  ...

  const login = async (): Promise<void> => {
    const authResult = await AuthConnect.login(provider, options);
    setAuthResult(authResult);
    setIsAuthenticated(true);
  };

  const logout = async (): Promise<void> => {
    if (authResult) {
      await AuthConnect.logout(provider, authResult);
      setAuthResult(null);
      setIsAuthenticated(false);
    }
  };

  return <AuthContext.Provider value={{ isAuthenticated, login, logout }}>{isSetup && children}</AuthContext.Provider>;
};
```

Use `isAuthenticated` in `Tab1.tsx` to display only the Login or the Logout button, depending on the current login status. First, update the bindings on the buttons:

```tsx
{
  !isAuthenticated ? (
    <IonButton onClick={handleLogin}>Login</IonButton>
  ) : (
    <IonButton onClick={handleLogout}>Logout</IonButton>
  );
}
```

Notice the added conditions to display the buttons and the changes to the `onClick` event bindings. Integrate the following code into the existing `Tab1` component code:

```typescript
const { isAuthenticated, login, logout } = useContext(AuthContext);

const handleLogin = async () => {
  try {
    await login();
  } catch (err) {
    console.log('Error logging in:', err);
  }
};

const handleLogout = async () => {
  await logout();
};
```

Notice the `try ... catch` in `handleLogin()`. The `login()` method will throw an error if the user fails to log in. Production applications should have some kind of handling here, but our sample can get away with simply logging the fact.

At this point, you should see the Login button if you are not logged in and the Logout button if you are.

### Get the Tokens

We can now log in and out, but what about getting at the tokens that our OIDC provider gave us? This information is stored as part of the `AuthResult`. Auth Connect also includes some methods that allow us to easily look at the contents of the tokens. For example:

```typescript
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
```

**Note:** the format and data stored in the ID token may change based on your provider and configuration. Check the documentation and configuration of your own provider for details.

Add these to `src/providers/AuthProvider.tsx` and export them as part of the `AuthContext` like we did for the other functions.

You can use these wherever you need to supply a specific token. For example, if you are accessing a backend API that requires you to include a bearer token (and you probably are if you are using Auth Connect), then you can use the `getAccessToken()` method to create an HTTP interceptor that adds the token.

We don't need an interceptor for this app, but as a challenge for you, update `Tab1.tsx` to show the current user's name when they are logged in. You could also display the access token if you want (though you would _never_ do that in a real app).

### Refreshing the Authentication

In a typical OIDC implementation, access tokens are very short lived. In such a case, it is common to use a longer lived refresh token to obtain a new `AuthResult`.

Let's add a function to `src/providers/AuthProvider.tsx` that does the refresh, and then modify `getAuthResult()` to call it when needed.

```typescript
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
  if (authResult && (await AuthConnect.isAccessTokenExpired(authResult))) {
    const newAuthResult = await refreshAuth(authResult);
    setAuthResult(newAuthResult);
  }
  setIsAuthenticated(!!authResult);
  return authResult;
};
```

Now anything using `getAuthResult()` to get the current auth result will automatically handle a refresh if needed.

## Store the Auth Result

Up until this point, we have been storing our `AuthResult` in a local state variable in `src/providers/AuthProvider.tsx`. This has a couple of disadvantages:

- Our tokens could show up in a stack trace.
- Our tokens do not survive a browser refresh or application restart.

There are several options we could use to store the `AuthResult`, but one that handles persistence as well as storing the data in a secure location on native devices is <a href="https://ionic.io/docs/identity-vault" target="_blank">Ionic Identity Vault</a>.

For our application, we will install Identity Vault and use it in "Secure Storage" mode to store the tokens. The first step is to install the product.

```bash
npm i @ionic-enterprise/identity-vault
```

Next, we will create a factory that builds either the actual Vault - if we are on a device - or a browser-based "Vault" that is suitable for development if we are in the browser. The following code should go in `src/providers/SessionVaultProvider.tsx`:

```typescript
import { BrowserVault, IdentityVaultConfig, Vault } from '@ionic-enterprise/identity-vault';
import { isPlatform } from '@ionic/react';

const createVault = (config: IdentityVaultConfig): Vault | BrowserVault => {
  return isPlatform('hybrid') ? new Vault(config) : new BrowserVault(config);
};
```

This provides us with a secure Vault on our devices, or a fallback Vault that allows us to keep using our browser-based development flow.

With the factory in place to build our Vault, let's create a Context that will allow us to manage our authentication result. Add the following code to `src/providers/SessionVaultProvider.tsx`:

```tsx
...
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
```

Then, add the provider to `App.tsx`. Place the component in between `<IonApp>` and `<AuthProvider>`, like so:

```jsx
<IonApp>
  <SessionVaultProvider>
    <AuthProvider>...</AuthProvider>
  </SessionVaultProvider>
</IonApp>
```

Finally, modify `src/providers/AuthProvider.tsx` to use `SessionVaultContext`. The goal is to no longer store the auth result in a session variable. Instead, we will use the session vault to store the result and retrieve it from the Vault as needed.

Remove the `const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);` line of code and replace it with the following:

```typescript
const { clearSession, getSession, setSession } = useContext(SessionVaultContext);
```

Create a function named `saveAuthResult()`. This function will either save the `AuthResult` to the Vault, or clear the auth result from the Vault when the session is no longer valid.

```typescript
const saveAuthResult = async (authResult: AuthResult | null): Promise<void> => {
  if (authResult) {
    await setSession(authResult);
    setIsAuthenticated(true);
  } else {
    await clearSession();
    setIsAuthenticated(false);
  }
};
```

Modify `getAuthResult()` to obtain the auth result from the Vault:

```typescript
const getAuthResult = async (): Promise<AuthResult | null> => {
  let authResult = await getSession();

  if (authResult && (await AuthConnect.isAccessTokenExpired(authResult))) {
    const newAuthResult = await refreshAuth(authResult);
    saveAuthResult(newAuthResult);
  }
  setIsAuthenticated(!!authResult);
  return authResult;
};
```

Finally, modify `login()` and `logout()` to both to save the results of the operation(s) accordingly:

```typescript
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
```

You should now be able to refresh the app and have a persistent session.

## Guard the Routes

It's common to have routes in your application that only logged in users could see.

One way this could be achieved is by using the `isAuthenticated` state variable to guard the routes. In a production scenario, the route guard component could look something like this:

```typescript
import { useContext, useEffect, useState } from 'react';
import { Redirect, Route, useLocation } from 'react-router';
import { AuthContext } from './providers/AuthProvider';

export const PrivateRoute = ({ children }: any) => {
  const { getAccessToken, isAuthenticated } = useContext(AuthContext);

  // Calling `getAccessToken()` will check if the session is valid,
  // and update `isAuthenticated` accordingly.
  useEffect(() => {
    getAccessToken();
  }, [getAccessToken]);

  if (!isAuthenticated) return <Redirect to="/login" />;
  return children;
};
```

`<PrivateRoute />` would then wrap protected components like so:

```jsx
<Route path="/user-settings">
  <PrivateRoute>
    <UserSettings />
  </PrivateRoute>
</Route>
```

If the current user is not authenticated, when `/user-settings` is navigated to, the application will redirect to `/login`.
