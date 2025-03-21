import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { petitions } from '../../services/api';
import AddPetitionForm from '../../components/petitions/AddPetitionForm';
import axios from 'axios';

interface StatCard {
  name: string;
  value: number;
  change: string;
  changeType: 'increase' | 'decrease';
}

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  category: string;
  priority: string;
}

export const Dashboard = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  console.log(user);
  
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentPetitions, setRecentPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddPetition, setShowAddPetition] = useState(false);
  


  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch petitions with a limit of 5 for recent petitions
      const response = await petitions.getAll({ limit: 5 });
      
      if (response.data) {
        setRecentPetitions(response.data);
        
        // Calculate stats from the full data
        const total = response.pagination?.total || 0;
        const active = response.data.filter(p => p.status === 'pending' || p.status === 'in_progress').length;
        const resolved = response.data.filter(p => p.status === 'resolved').length;
        
        setStats([
          {
            name: 'Total Petitions',
            value: total,
            change: '+0%', // You might want to calculate this based on historical data
            changeType: 'increase',
          },
          {
            name: 'Active Petitions',
            value: active,
            change: '+0%',
            changeType: 'increase',
          },
          {
            name: 'Resolved Petitions',
            value: resolved,
            change: '+0%',
            changeType: 'increase',
          },
          {
            name: 'Average Response Time',
            value: 24, // This should be calculated based on actual resolution times
            change: '0%',
            changeType: 'increase',
          },
        ]);
      }
      
      setError('');
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handlePetitionSuccess = () => {
    setShowAddPetition(false);
    fetchDashboardData(); // Refresh the dashboard data
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6 bg-red-50 rounded-lg">
        <div className="text-red-600 font-medium">{error}</div>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome section with Add Petition button */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome back, {user?.email || 'User'}!
            </h2>
            <p className="mt-1 text-gray-600">
              Here's what's happening with your petitions today.
            </p>
          </div>
          <button
            onClick={() => setShowAddPetition(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Add Petition
          </button>
        </div>
      </div>

      {/* Add Petition Modal */}
      {showAddPetition && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Petition</h3>
            <AddPetitionForm
              onSuccess={handlePetitionSuccess}
              onCancel={() => setShowAddPetition(false)}
            />
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">{stat.name}</h3>
              <div
                className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
                  stat.changeType === 'increase'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {stat.change}
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent petitions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Petitions</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentPetitions.length === 0 ? (
            <div className="px-6 py-4 text-center text-gray-500">
              No petitions found. Create your first petition to get started!
            </div>
          ) : (
            recentPetitions.map((petition) => (
              <div key={petition._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {petition.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500">
                      {petition.description.length > 100
                        ? `${petition.description.substring(0, 100)}...`
                        : petition.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-4">
                      <span className="text-xs text-gray-500">
                        {new Date(petition.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        Category: {petition.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        Priority: {petition.priority}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      petition.status === 'resolved'
                        ? 'bg-green-100 text-green-800'
                        : petition.status === 'in_progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {petition.status.replace('_', ' ').charAt(0).toUpperCase() +
                      petition.status.slice(1)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;