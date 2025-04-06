import React from 'react';
import { ApplicationStatus } from '../types';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface StatusTrackerProps {
  status: ApplicationStatus;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({ status }) => {
  const getStatusIcon = () => {
    switch (status.status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'reviewing':
        return <RefreshCw className="h-6 w-6 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewing':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Application Status</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
        </span>
      </div>
      <div className="flex items-center space-x-3 text-gray-500">
        {getStatusIcon()}
        <div>
          <p className="text-sm">Last updated: {new Date(status.lastUpdated).toLocaleString()}</p>
          {status.comments && (
            <p className="mt-1 text-sm text-gray-600">{status.comments}</p>
          )}
        </div>
      </div>
    </div>
  );
};