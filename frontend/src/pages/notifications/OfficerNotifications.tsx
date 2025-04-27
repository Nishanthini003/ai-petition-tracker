import React from 'react';
import { Card, Tag, Button, Badge } from 'antd';
import {
  ExclamationCircleOutlined,
  HistoryOutlined,
  BellOutlined
} from '@ant-design/icons';

interface Petition {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsProps {
  urgentPetitions: Petition[];
  repetitivePetitions: Petition[];
  onViewDetails: (petition: Petition) => void;
}

const OfficerNotifications: React.FC<NotificationsProps> = ({
  urgentPetitions,
  repetitivePetitions,
  onViewDetails
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <Tag color="blue">
          <Badge count={urgentPetitions.length + repetitivePetitions.length} size="small">
            <BellOutlined className="mr-1" />
            Alerts
          </Badge>
        </Tag>
      </div>

      <Card title={
        <div className="flex items-center">
          <ExclamationCircleOutlined className="text-red-500 mr-2" />
          <span>Urgent Petitions ({urgentPetitions.length})</span>
        </div>
      } className="mb-6">
        {urgentPetitions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No urgent petitions</div>
        ) : (
          <div className="space-y-4">
            {urgentPetitions.map(petition => (
              <div key={petition._id} className="border-l-4 border-red-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{petition.title}</h4>
                    <p className="text-gray-600 text-sm line-clamp-1">{petition.description}</p>
                    <div className="mt-1">
                      <Tag color="red">Urgent</Tag>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(petition.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button size="small" onClick={() => onViewDetails(petition)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={
        <div className="flex items-center">
          <HistoryOutlined className="text-purple-500 mr-2" />
          <span>Repetitive Petitions ({repetitivePetitions.length})</span>
        </div>
      }>
        {repetitivePetitions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No repetitive petitions</div>
        ) : (
          <div className="space-y-4">
            {repetitivePetitions.map(petition => (
              <div key={petition._id} className="border-l-4 border-purple-500 pl-4 py-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{petition.title}</h4>
                    <p className="text-gray-600 text-sm line-clamp-1">{petition.description}</p>
                    <div className="mt-1">
                      <Tag color="purple">Repetitive</Tag>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(petition.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button size="small" onClick={() => onViewDetails(petition)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default OfficerNotifications
