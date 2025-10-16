import React from 'react';
import { AdminAccountDeletion } from './AdminAccountDeletion';

interface UserAccountActionsProps {
  userId: number;
  userName?: string;
  userEmail?: string;
}

export const UserAccountActions: React.FC<UserAccountActionsProps> = ({
  userId,
  userName,
  userEmail
}) => {
  return (
    <div className="flex items-center space-x-2">
      <AdminAccountDeletion 
        userId={userId}
        userName={userName}
        userEmail={userEmail}
      />
    </div>
  );
};
