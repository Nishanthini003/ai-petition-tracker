import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import axios from 'axios';
import type { RootState } from '../../store';

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    dispatch(logout());
  };

  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/department/officers/');
        console.log(response.data);
        
        setOfficers(response.data);
      } catch (err) {
        setError('Failed to fetch officers');
      } finally {
        setLoading(false);
      }
    };

    fetchOfficers();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="mr-4">
              <img
                className="h-10 w-10 rounded-full"
                src="https://via.placeholder.com/40"
                alt="Admin Profile"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.email}</h2>
              <p className="text-sm text-gray-600">Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Officers</h3>
        {loading ? (
          <p>Loading officers...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {officers.map((officer) => (
                <li key={officer._id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{officer.name} ({officer.email})</p>
                    <p className="text-sm text-gray-500">Department: {officer.department}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
