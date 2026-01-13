import React from 'react';

export default function UserInfoBanner({ user }) {
  if (!user || !user.patient) return null;

  // Format last login date if available
  const formattedLastLogin = user.last_login 
    ? new Date(user.last_login).toLocaleString() 
    : 'First Login';

  return (
    <div className="bg-yellow-100 border-b border-yellow-200">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-col sm:flex-row justify-between items-center text-sm text-yellow-800">
        <div className="font-semibold mb-1 sm:mb-0">
          Hello {user.patient.first_name} {user.patient.last_name}
        </div>
        <div className="flex space-x-6">
          <span className="flex items-center">
            <span className="font-medium mr-1">National ID:</span> 
            {user.national_id || 'N/A'}
          </span>
          <span className="flex items-center">
            <span className="font-medium mr-1">Last Login:</span> 
            {formattedLastLogin}
          </span>
        </div>
      </div>
    </div>
  );
}
