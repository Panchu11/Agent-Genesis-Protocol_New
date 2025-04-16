'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import db from '@/services/db.service';
import { User } from '@/types';

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  error: null,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // For now, we'll just use the default user
      const defaultUser = await db.users.get('default-user');
      
      if (defaultUser) {
        setUser(defaultUser);
      } else {
        // If no user exists, create a default one
        const newUser: User = {
          id: 'default-user',
          name: 'User',
          points: 0,
          achievements: [],
          createdAt: Date.now(),
          lastLoginAt: Date.now(),
          streak: 0
        };
        
        await db.users.add(newUser);
        setUser(newUser);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <UserContext.Provider value={{ user, isLoading, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};
