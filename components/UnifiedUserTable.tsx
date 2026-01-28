'use client';

import React, { useState } from 'react';
import { Search, Filter, ExternalLink, Mail, User, Database, Sheet, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { UnifiedUserModal } from './UnifiedUserModal';

interface UnifiedUserTableProps {
  users: any[];
}

type SortField = 'name' | 'totalSpentWhop' | 'totalSpentSheet' | 'lastPaymentDate';
type SortOrder = 'asc' | 'desc' | null;

export const UnifiedUserTable: React.FC<UnifiedUserTableProps> = ({ users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [sortField, setSortField] = useState<SortField | null>('lastPaymentDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filteredUsers = users.filter(user => 
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortOrder === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30" />;
    if (sortOrder === 'asc') return <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />;
    return <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="p-8 border-b border-gray-50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Unified User Database</h2>
            <p className="text-gray-500 font-medium">Combined data from AI CEOS and Google Sheets</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-gray-50 border-none rounded-2xl w-full md:w-80 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th 
                className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  User <SortIcon field="name" />
                </div>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
              <th 
                className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => handleSort('totalSpentWhop')}
              >
                <div className="flex items-center justify-end">
                  AI CEOS Revenue <SortIcon field="totalSpentWhop" />
                </div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => handleSort('totalSpentSheet')}
              >
                <div className="flex items-center justify-end">
                  Sheet Revenue <SortIcon field="totalSpentSheet" />
                </div>
              </th>
              <th 
                className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors"
                onClick={() => handleSort('lastPaymentDate')}
              >
                <div className="flex items-center">
                  Last Activity <SortIcon field="lastPaymentDate" />
                </div>
              </th>
              <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedUsers.map((user) => (
              <tr 
                key={user.email} 
                className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                      {user.name ? user.name.charAt(0) : '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-wrap gap-2">
                    {user.source.includes('Whop') && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        <Database className="w-3 h-3" /> AI CEOS
                      </span>
                    )}
                    {user.source.includes('Sheet') && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        <Sheet className="w-3 h-3" /> Sheet
                      </span>
                    )}
                    {user.source.includes('Pipeline') && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        <Database className="w-3 h-3" /> Pipeline
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-gray-900">
                      ${user.totalSpentWhop.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {user.totalSpentWhopBeforeFees && (
                      <span className="text-[10px] font-medium text-gray-500">
                        <span className="line-through">${user.totalSpentWhopBeforeFees.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="ml-1 text-[8px] uppercase tracking-tighter">Before Fee</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-5 text-right font-bold text-gray-600">
                  ${user.totalSpentSheet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-8 py-5">
                  <p className="text-sm font-bold text-gray-700">
                    {user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : 'N/A'}
                  </p>
                </td>
                <td className="px-8 py-5">
                  <button className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-blue-600">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <UnifiedUserModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
        />
      )}
    </div>
  );
};
