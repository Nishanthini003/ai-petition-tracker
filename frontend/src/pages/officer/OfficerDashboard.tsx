import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import type { RootState } from '../../store';
import { fetchAllPetitions, updatePetitionStatus } from '../../services/api';
import { Select, Button, Card, Tag, message, Modal } from 'antd';
import {
  LogoutOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  FileDoneOutlined
} from '@ant-design/icons';
import { FiUser } from 'react-icons/fi';
import axios from 'axios';

const { Option } = Select;

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: 'new' | 'pending' | 'in_progress' | 'resolved' | 'rejected';
  category: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  new: 'blue',
  pending: 'orange',
  in_progress: 'processing',
  resolved: 'success',
  rejected: 'error'
};

const statusIcons = {
  new: <FileDoneOutlined />,
  pending: <ClockCircleOutlined />,
  in_progress: <SyncOutlined spin />,
  resolved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />
};

const OfficerDashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  console.log(user);
  
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [filteredPetitions, setFilteredPetitions] = useState<Petition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPetition, setSelectedPetition] = useState<Petition | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  useEffect(() => {
    fetchPetitions();
  }, []);

  useEffect(() => {
    if (user?.department && petitions.length > 0) {
      const deptPetitions = petitions.filter(
        (petition) => petition.category?.toLowerCase() === user.department?.toLowerCase()
      );
      setFilteredPetitions(deptPetitions);
    }
  }, [user?.department, petitions]);

  const fetchPetitions = async () => {
    setLoading(true);
    try {
      const data = await fetchAllPetitions();
      console.log(data);
      
      setPetitions(data);
      message.success('Petitions loaded successfully');
    } catch (error) {
      message.error('Failed to fetch petitions');
      console.error('Error fetching petitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (petitionId, newStatus) => {
    console.log(petitionId, newStatus);
    
    try {
      const result = await axios.patch(`http://localhost:5000/api/petitions/${petitionId}/status`, {
        status: newStatus,
        userId: user?._id
      });
      // Update your local state with the returned data
      setPetitions(petitions.map(p => 
        p._id === result.data._id ? { ...p, status: result.data.status } : p
      ));
      fetchPetitions()
      message.success('Status updated successfully');
    } catch (error) {
      console.error('Status update failed:', error);
      message.error('Failed to update status');
    }
  };

  const handleViewDetails = (petition: Petition) => {
    setSelectedPetition(petition);
    setIsModalVisible(true);
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {
              user?.photo ? <img src={user?.photo} alt={user?.name} className='w-10 h-10 rounded-full' /> : <FiUser className='size-10' />
            }
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{user?.name || user?.email}</h1>
              <p className="text-sm text-gray-500">
                {user?.department} Department
              </p>
            </div>
          </div>
          <Button
            type="primary"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Department Petitions</h2>
          <Tag color="blue">{filteredPetitions.length} petitions</Tag>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <SyncOutlined spin className="text-4xl text-blue-500" />
          </div>
        ) : filteredPetitions.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <FileDoneOutlined className="text-4xl text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No petitions found</h3>
              <p className="text-gray-500">There are currently no petitions assigned to your department</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredPetitions.map((petition) => (
              <Card key={petition._id} className="hover:shadow-lg transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{petition.title}</h3>
                    <p className="text-gray-600 mt-1 line-clamp-2">{petition.description}</p>
                    <div className="mt-3 flex items-center space-x-4">
                      <Tag icon={statusIcons[petition.status]} color={statusColors[petition.status]}>
                        {petition.status.replace('_', ' ')}
                      </Tag>
                      <span className="text-sm text-gray-500">
                        Received: {new Date(petition.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button type="link" onClick={() => handleViewDetails(petition)}>
                      View
                    </Button>
                    <Select
                      style={{ width: 150 }}
                      value={petition.status}
                      onChange={(value) => handleStatusChange(petition._id, value)}
                    >
                      <Option value="new">New</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="in_progress">In Progress</Option>
                      <Option value="resolved">Resolved</Option>
                      <Option value="rejected">Rejected</Option>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Petition Detail Modal */}
      <Modal
        title="Petition Details"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {selectedPetition && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Title</h4>
              <p>{selectedPetition.title}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Description</h4>
              <p className="whitespace-pre-line">{selectedPetition.description}</p>
            </div>
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Status</h4>
                <Tag icon={statusIcons[selectedPetition.status]} color={statusColors[selectedPetition.status]}>
                  {selectedPetition.status.replace('_', ' ')}
                </Tag>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Received</h4>
                <p>{new Date(selectedPetition.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OfficerDashboard;