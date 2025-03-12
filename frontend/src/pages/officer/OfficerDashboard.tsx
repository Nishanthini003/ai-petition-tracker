import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DashboardStats } from '../../components/dashboard/DashboardStats';
import { FilterBar } from '../../components/dashboard/FilterBar';
import { PetitionTable } from '../../components/dashboard/PetitionTable';
import { OfficerProfile } from '../../components/profile/OfficerProfile';
import { officer } from '../../services/api';
import type { RootState } from '../../store';
import axios from 'axios';

interface Petition {
  _id: string;
  title: string;
  description: string;
  creator: {
    mobile: string;
    name?: string;
  };
  status: 'new' | 'pending' | 'in_progress' | 'resolved';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  category: string;
}

export const OfficerDashboard = () => {
  const [allPetitions, setAllPetitions] = useState<Petition[]>([]);
  const [filteredPetitions, setFilteredPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    sortBy: 'createdAt',
    search: ''
  });

  const user = useSelector((state: RootState) => state.auth.user);

  // Calculate dashboard stats
  const stats = {
    total: allPetitions.length,
    pending: allPetitions.filter(p => p.status === 'pending').length,
    resolved: allPetitions.filter(p => p.status === 'resolved').length,
    urgent: allPetitions.filter(p => p.priority === 'high').length,
    avgResponseTime: '24h' // This should be calculated based on actual data
  };

  useEffect(() => {
    if (user?.department) {
      fetchPetitions();
    }
  }, [user?.department]);

  useEffect(() => {
    applyFilters();
  }, [filters, allPetitions]);

  const fetchPetitions = async () => {
    try {
      setLoading(true);
      // Get petitions based on department keywords
      const response = await officer.getAssignedPetitions();
      setAllPetitions(response.data);
      setFilteredPetitions(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch petitions');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    let result = [...allPetitions];

    // Apply status filter
    if (filters.status) {
      result = result.filter(petition => petition.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(petition => petition.priority === filters.priority);
    }

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        petition =>
          petition.title.toLowerCase().includes(searchLower) ||
          petition.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'priority':
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (
            priorityOrder[a.priority as keyof typeof priorityOrder] -
            priorityOrder[b.priority as keyof typeof priorityOrder]
          );
        case 'status':
          const statusOrder = { new: 0, pending: 1, in_progress: 2, resolved: 3 };
          return (
            statusOrder[a.status as keyof typeof statusOrder] -
            statusOrder[b.status as keyof typeof statusOrder]
          );
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    setFilteredPetitions(result);
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      if (status === 'received') {
        await petitions.markAsReceived(id);
      } else {
        await petitions.update(id, { status });
      }
      // Refresh petitions after update
      fetchPetitions();
    } catch (err: any) {
      setError(err.message || 'Failed to update petition status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Officer Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name}! You're managing the {user?.department} department.
          </p>
        </div>
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showProfile ? 'Hide Profile' : 'View Profile'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <DashboardStats stats={stats} />

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manage Petitions</h2>
            <FilterBar filters={filters} onFilterChange={handleFilterChange} />
            <PetitionTable 
              petitions={filteredPetitions} 
              onStatusChange={handleStatusChange}
              showReceiveButton={true}
            />
          </div>
        </div>

        {showProfile && (
          <div className="lg:col-span-1">
            <OfficerProfile />
          </div>
        )}
      </div>
    </div>
  );
};
