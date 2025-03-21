import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import axios from 'axios';

const OfficerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const [petitions, setPetitions] = useState([]);

  useEffect(() => {
    getPetitions();
  }, []);

  const getPetitions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/petitions');
      setPetitions(response.data.petitions); // Ensure this matches the API response structure
      console.log(response.data.petitions);
    } catch (error) {
      console.error('Failed to fetch petitions:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="mr-4">
              <img
                className="h-10 w-10 rounded-full"
                src="https://via.placeholder.com/40"
                alt="Officer Profile"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.email}</h2>
              <p className="text-sm text-gray-600">Department Officer : {user?.department}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-4">Received Petitions</h3>
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200">
            {petitions.map((petition) => (
              <li key={petition._id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{petition.title}</p>
                  <p className="text-sm text-gray-500">Status: {petition.status}</p>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <p className="flex items-center text-sm text-gray-500">
                    Received: {petition.receivedDate}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;