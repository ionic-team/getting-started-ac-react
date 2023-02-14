import { useContext, useEffect, useState } from 'react';
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { AuthContext } from '../providers/AuthProvider';
import './Tab1.css';

const Tab1: React.FC = () => {
  const { isAuthenticated, getUserName, login, logout } = useContext(AuthContext);
  const [userName, setUserName] = useState<string>();

  useEffect(() => {
    getUserName().then(setUserName);
  }, [isAuthenticated, getUserName]);

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

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Tab 1</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">Tab 1</IonTitle>
          </IonToolbar>
        </IonHeader>
        {userName && <h1>{userName}</h1>}
        {!isAuthenticated ? (
          <IonButton onClick={handleLogin}>Login</IonButton>
        ) : (
          <IonButton onClick={handleLogout}>Logout</IonButton>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
