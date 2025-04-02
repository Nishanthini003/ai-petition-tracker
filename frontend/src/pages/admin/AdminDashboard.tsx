import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import axios from 'axios';
import type { RootState } from '../../store';
import { FiLogOut, FiUsers, FiActivity, FiSettings, FiUser, FiHome, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Modal, Button, Input, Select, message } from 'antd';

const { Option } = Select;

interface Officer {
  _id: string;
  email: string;
  name: string;
  badgeNumber: string;
  department: string;
  position: string;
  contactNumber: string;
  isActive: boolean;
  photo?: string;
}

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [filteredOfficers, setFilteredOfficers] = useState<Officer[]>([]);
  const [stats, setStats] = useState({
    totalOfficers: 0,
    activeOfficers: 0,
    departments: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    badgeNumber: '',
    department: '',
    position: '',
    contactNumber: ''
  });

  const departments = [
    'Environment', 'Justice', 'Health', 'Education', 'Housing',
    'Transportation', 'Labor', 'Energy', 'Agriculture', 'Finance',
    'Public Safety', 'Social Welfare', 'Water Resources', 'Communications', 
    'Consumer Affairs'
  ];

  const handleLogout = () => {
    dispatch(logout());
  };

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get<ApiResponse>('http://localhost:5000/api/department/');
      
      if (response.data.status === 'success' && Array.isArray(response.data.data.officers)) {
        setOfficers(response.data.data.officers);
        setFilteredOfficers(response.data.data.officers);
        setStats({
          totalOfficers: response.data.results,
          activeOfficers: response.data.data.officers.filter(o => o.isActive).length,
          departments: [...new Set(response.data.data.officers.map(o => o.department))].length
        });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error fetching officers:', err);
      setError('Failed to fetch officers');
      message.error('Failed to fetch officers. Please try again later.');
      setOfficers([]);
      setFilteredOfficers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/department/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  useEffect(() => {
    fetchOfficers();
    // fetchStats();
  }, []);

  useEffect(() => {
    const filtered = officers.filter(officer =>
      officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOfficers(filtered);
  }, [searchTerm, officers]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const showModal = (officer: Officer | null = null) => {
    if (officer) {
      setCurrentOfficer(officer);
      setFormData({
        email: officer.email,
        password: '',
        name: officer.name,
        badgeNumber: officer.badgeNumber,
        department: officer.department,
        position: officer.position,
        contactNumber: officer.contactNumber
      });
    } else {
      setCurrentOfficer(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        badgeNumber: '',
        department: '',
        position: '',
        contactNumber: ''
      });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value: string) => {
    setFormData(prev => ({ ...prev, department: value }));
  };

  const handleSubmit = async () => {
    try {
      if (currentOfficer) {
        // Update existing officer
        await axios.patch(`http://localhost:5000/api/department/${currentOfficer._id}`, formData);
        message.success('Officer updated successfully');
      } else {
        // Create new officer
        await axios.post('http://localhost:5000/api/department/', formData);
        message.success('Officer created successfully');
      }
      fetchOfficers();
      setIsModalVisible(false);
    } catch (err) {
      message.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/department/${id}`);
      message.success('Officer deleted successfully');
      fetchOfficers();
    } catch (err) {
      message.error('Failed to delete officer');
    }
  };

  const departmentData = departments.map(dept => {
    const count = officers.filter(o => o.department === dept).length;
    return { name: dept, officers: count };
  }).filter(item => item.officers > 0);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64 bg-indigo-700 text-white">
          <div className="flex items-center justify-center h-16 px-4 bg-indigo-800">
            <h1 className="text-xl font-bold">Administrative</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            <a href="#" className="flex items-center px-4 py-2 text-white bg-indigo-800 rounded-lg">
              <FiHome className="mr-3" />
              Dashboard
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-indigo-200 hover:text-white hover:bg-indigo-600 rounded-lg">
              <FiUsers className="mr-3" />
              Officers
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-indigo-200 hover:text-white hover:bg-indigo-600 rounded-lg">
              <FiActivity className="mr-3" />
              Reports
            </a>
            <a href="#" className="flex items-center px-4 py-2 text-indigo-200 hover:text-white hover:bg-indigo-600 rounded-lg">
              <FiSettings className="mr-3" />
              Settings
            </a>
          </nav>
          <div className="p-4 border-t border-indigo-600">
            <div className="flex items-center">
              <div className="mr-3">
                <FiUser className="w-8 h-8 text-indigo-200" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <button 
                  onClick={handleLogout}
                  className="text-xs text-indigo-200 hover:text-white flex items-center"
                >
                  <FiLogOut className="mr-1" /> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-800">Officer Management</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="relative">
                <FiUser className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Officers</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {loading ? '...' : stats.totalOfficers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <FiActivity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Officers</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {loading ? '...' : stats.activeOfficers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <FiSettings className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Departments</p>
                  <p className="text-2xl font-semibold text-gray-800">
                    {loading ? '...' : stats.departments}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Search */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Officers by Department</h3>
              <div className="h-64">
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="officers" fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    No department data available
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Officer Search</h3>
              <div className="flex mb-4">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="text-gray-400" />
                  </div>
                  <Input
                    placeholder="Search officers..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>
                <Button
                  type="primary"
                  icon={<FiPlus />}
                  className="ml-4"
                  onClick={() => showModal()}
                >
                  Add Officer
                </Button>
              </div>
              <div className="space-y-4">
                {filteredOfficers.slice(0, 3).map(officer => (
                  <div key={officer._id} className="flex items-start p-3 hover:bg-gray-50 rounded-lg">
                    <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                      <FiUser className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{officer.name}</p>
                      <p className="text-xs text-gray-500">{officer.department} • {officer.position}</p>
                    </div>
                    <button 
                      onClick={() => showModal(officer)}
                      className="text-indigo-600 hover:text-indigo-800"
                    >
                      <FiEdit2 />
                    </button>
                  </div>
                ))}
                {filteredOfficers.length > 3 && (
                  <div className="text-center text-sm text-indigo-600">
                    {filteredOfficers.length - 3} more officers found
                  </div>
                )}
                {filteredOfficers.length === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    No officers found matching your search
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Officers Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">All Department Officers</h3>
              <div className="flex space-x-2">
                <Button
                  type="primary"
                  icon={<FiPlus />}
                  onClick={() => showModal()}
                >
                  Add Officer
                </Button>
              </div>
            </div>
            {loading ? (
              <div className="p-6 text-center">
                <p>Loading officers...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">
                {error}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Officer
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOfficers.map((officer) => (
                      <tr key={officer._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img className="h-10 w-10 rounded-full" src={officer.photo || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTo0vRipjHMf43IZOUDNl-pnZl5gTiNnCSHcQ&s'} alt="" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{officer.name}</div>
                              <div className="text-sm text-gray-500">#{officer.badgeNumber}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{officer.email}</div>
                          <div className="text-sm text-gray-500">{officer.contactNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{officer.department}</div>
                          <div className="text-sm text-gray-500">{officer.position}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${officer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {officer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => showModal(officer)}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <FiEdit2 className="inline mr-1" /> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(officer._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="inline mr-1" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Officer Form Modal */}
      <Modal
        title={currentOfficer ? "Edit Officer" : "Add New Officer"}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={currentOfficer ? "Update" : "Create"}
        cancelText="Cancel"
        width={700}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Officer Name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Officer Email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number</label>
            <Input
              name="badgeNumber"
              value={formData.badgeNumber}
              onChange={handleInputChange}
              placeholder="Badge Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <Select
              className="w-full"
              value={formData.department}
              onChange={handleDepartmentChange}
              placeholder="Select Department"
            >
              {departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <Input
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Position/Rank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
            <Input
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              placeholder="Contact Number"
            />
          </div>
          {!currentOfficer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input.Password
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;