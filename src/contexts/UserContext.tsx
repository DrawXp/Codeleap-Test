import { createContext, useState, ReactNode, useContext } from 'react';

interface UserContextData {
  username: string;
  setUsername: (username: string) => void;
  logout: () => void;
}

export const UserContext = createContext<UserContextData>({} as UserContextData);

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsernameState] = useState(() => {
    return localStorage.getItem('@codeleap:username') || '';
  });

  const setUsername = (newUsername: string) => {
    setUsernameState(newUsername);
    localStorage.setItem('@codeleap:username', newUsername);
  };

  const logout = () => {
    setUsernameState('');
    localStorage.removeItem('@codeleap:username');
  };

  return (
    <UserContext.Provider value={{ username, setUsername, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);