import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';

export function useUserSession() {
  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiClient.get('/api/users');
      setAllUsers(res.data);
      
      const savedUserId = localStorage.getItem('active_user_id');
      if (savedUserId) {
        const found = res.data.find(u => u.id === parseInt(savedUserId, 10));
        if (found) {
          setCurrentUser(found);
          setLoading(false);
          return found;
        }
      }

      if (res.data.length > 0) {
        setCurrentUser(res.data[0]);
        localStorage.setItem('active_user_id', res.data[0].id.toString());
      } else {
        setIsModalOpen(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to backend user service.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const registerUser = async (username) => {
    setError(null);
    try {
      const res = await apiClient.post('/api/users/register', { username });
      const newUser = res.data;
      setCurrentUser(newUser);
      localStorage.setItem('active_user_id', newUser.id.toString());
      await fetchUsers();
      setIsModalOpen(false);
      return newUser;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed.';
      setError(msg);
      throw new Error(msg);
    }
  };

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('active_user_id', user.id.toString());
    setIsModalOpen(false);
  };

  return {
    currentUser,
    allUsers,
    loading,
    error,
    isModalOpen,
    setIsModalOpen,
    registerUser,
    switchUser,
    refreshUsers: fetchUsers
  };
}
