import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiBaseUrl } from '../lib/api';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch projects');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (payload) => {
    const response = await fetch(`${getApiBaseUrl()}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    await fetchProjects();
    return data.project;
  };

  const deleteProject = async (id) => {
    const response = await fetch(`${getApiBaseUrl()}/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    await fetchProjects();
  };

  return { projects, loading, error, fetchProjects, createProject, deleteProject };
}
