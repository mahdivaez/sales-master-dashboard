import React from 'react';
import { UnifiedUser } from '@/types';
import { 
  Mail, 
  User, 
  Hash, 
  Calendar, 
  DollarSign, 
  Tag, 
  Activity, 
  Shield, 
  CreditCard,
  Download
} from 'lucide-react';

interface DetailedUserTableProps {
  users: UnifiedUser[];
}

export const DetailedUserTable: React.FC<DetailedUserTableProps> = ({ users }) => {
  const exportToCSV = () => {
    const headers = [
      'User ID', 'Name', 'Username', 'Email', 
      'Total Spent (USD)', 'Membership Count', 'Payment Count', 
      'Active Memberships', 'Last Payment Date', 'Last Payment Status'
    ];

    const rows = users.map(user => {
      const activeMemberships = user.memberships.filter(m => m.status === 'active' || m.status === 'trialing').length;
      const lastPayment = user.payments[0];
      return [
        user.id,
        user.name || '',
        user.username,
        user.email,
        user.totalSpent.toFixed(2),
        user.memberships.length,
        user.payments.length,
        activeMemberships,
        lastPayment ? new Date(lastPayment.created_at).toLocaleDateString() : 'N/A',
        lastPayment ? lastPayment.substatus : 'N/A'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Complete User Data</h3>
          <p className="text-sm text-gray-500">Detailed view of all user metrics and history</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-semibold text-sm shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3 h-3" /> ID
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3" /> User
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" /> LTV
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Memberships
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <CreditCard className="w-3 h-3" /> Payments
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-r border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Status
                </div>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Last Seen
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {users.map((user) => {
              const activeCount = user.memberships.filter(m => m.status === 'active' || m.status === 'trialing').length;
              const lastPayment = user.payments[0];
              
              return (
                <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] font-mono text-gray-400 border-r border-gray-50">
                    {user.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{user.name || user.username}</span>
                      <span className="text-[10px] text-gray-400">@{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 border-r border-gray-50">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                    <span className="text-sm font-black text-emerald-600">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(user.totalSpent)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-bold border border-blue-100">
                        {user.memberships.length} Total
                      </span>
                      {activeCount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-bold border border-emerald-100">
                          {activeCount} Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                    <span className="text-sm font-medium text-gray-700">{user.payments.length} txns</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap border-r border-gray-50">
                    {lastPayment ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter border ${
                        lastPayment.substatus === 'succeeded' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {lastPayment.substatus}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">No payments</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {lastPayment 
                        ? new Date(lastPayment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'
                      }
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100 text-[11px] text-gray-400 font-medium">
        Showing {users.length} users with complete historical data.
      </div>
    </div>
  );
};
