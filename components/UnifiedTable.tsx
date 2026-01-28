import React from 'react';
import { UnifiedUser } from '@/types';
import { Mail, CreditCard, Calendar, ExternalLink, ShieldCheck, Receipt, Wallet, UserCheck } from 'lucide-react';

interface UnifiedTableProps {
  users: UnifiedUser[];
  onUserClick?: (user: UnifiedUser) => void;
}

export const UnifiedTable: React.FC<UnifiedTableProps> = ({ users, onUserClick }) => {
  const getPaymentStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'succeeded':
      case 'completed':
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'draft':
      case 'drafted':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'failed':
      case 'voided':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getMembershipStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return {
          bg: 'bg-emerald-50 border-emerald-100',
          text: 'text-emerald-800',
          dot: 'bg-emerald-500',
          statusText: 'text-emerald-600'
        };
      case 'trialing':
        return {
          bg: 'bg-blue-50 border-blue-100',
          text: 'text-blue-800',
          dot: 'bg-blue-400',
          statusText: 'text-blue-500'
        };
      case 'draft':
      case 'drafted':
        return {
          bg: 'bg-amber-50 border-amber-100',
          text: 'text-amber-800',
          dot: 'bg-amber-500',
          statusText: 'text-amber-600'
        };
      case 'past_due':
      case 'canceled':
        return {
          bg: 'bg-rose-50 border-rose-100',
          text: 'text-rose-800',
          dot: 'bg-rose-500',
          statusText: 'text-rose-600'
        };
      case 'expired':
        return {
          bg: 'bg-gray-50 border-gray-100',
          text: 'text-gray-800',
          dot: 'bg-gray-400',
          statusText: 'text-gray-500'
        };
      default:
        return {
          bg: 'bg-indigo-50 border-indigo-100',
          text: 'text-indigo-800',
          dot: 'bg-indigo-500',
          statusText: 'text-indigo-600'
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-gray-400" />
                  User Details
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-400" />
                  Memberships
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  Transactions
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Last Activity
                </div>
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-2 justify-end">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  Total Revenue
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user) => (
              <tr 
                key={user.email} 
                className="hover:bg-gray-50/80 transition-colors group cursor-pointer"
                onClick={() => onUserClick?.(user)}
              >
                {/* User Details */}
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border border-gray-200">
                      {user.name ? user.name[0].toUpperCase() : user.username[0].toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-1">
                        {user.name || user.username}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Memberships */}
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-3">
                    {user.memberships.map((m) => {
                      const styles = getMembershipStatusStyles(m.status);
                      return (
                        <div key={m.id} className="flex flex-col gap-1">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${styles.bg}`}>
                            <div className="flex flex-col">
                              <span className={`text-xs font-bold leading-tight ${styles.text}`}>
                                {m.product.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />
                                <span className={`text-[10px] font-black uppercase tracking-wider ${styles.statusText}`}>
                                  {m.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <a 
                            href={m.manage_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-gray-400 hover:text-blue-600 flex items-center gap-0.5 ml-2 transition-colors font-medium"
                          >
                            Manage <ExternalLink className="w-2 h-2" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </td>

                {/* Transactions Count & Status */}
                <td className="px-6 py-5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      {user.payments.length} Payments
                    </div>
                    {user.payments.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getPaymentStatusStyles(user.payments[0].substatus)}`}>
                          {user.payments[0].substatus}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">Latest</span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Last Activity Date */}
                <td className="px-6 py-5 whitespace-nowrap">
                  {user.payments.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(user.payments[0].created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No activity</span>
                  )}
                </td>

                {/* Total Revenue */}
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(user.totalSpent)}
                    </div>
                    <div className="text-[10px] font-medium text-gray-500">
                      <span className="line-through">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(user.totalSpentBeforeFees)}</span>
                      <span className="ml-1 text-[8px] uppercase tracking-tighter">Before Fee</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter mt-1">
                    Lifetime Value
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
