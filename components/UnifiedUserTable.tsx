'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Mail, User, Database, Sheet, ArrowUp, ArrowDown, ArrowUpDown, Zap, CreditCard, Phone, Tag, Clock, Calendar } from 'lucide-react';
import { UnifiedUserModal } from './UnifiedUserModal';

interface UnifiedUserTableProps {
  users: any[];
}

type SortField = 'name' | 'totalSpentWhop' | 'totalSpentSheet' | 'totalSpentElective' | 'lastPaymentDate';
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const hasWhopActivity = (user.totalSpentWhop > 0) || 
                           (user.whopData?.payments && user.whopData.payments.length > 0) || 
                           (user.whopData?.memberships && user.whopData.memberships.length > 0);
                        
    const hasSheetActivity = (user.totalSpentSheet > 0) || 
                             (user.sheetData && user.sheetData.length > 0);

    const hasElectiveActivity = (user.totalSpentElective > 0) ||
                                (user.electiveData && user.electiveData.length > 0);

    const hasGhlActivity = !!user.ghlData;

    return matchesSearch && (hasWhopActivity || hasSheetActivity || hasElectiveActivity || hasGhlActivity);
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];
    if (aValue === null || aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
    if (bValue === null || bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortOrder === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
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
            <p className="text-gray-500 font-medium">Combined data from AI CEOS, Google Sheets, and GHL</p>
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
        <div className="min-w-[2200px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Name <SortIcon field="name" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bookings</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stage</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentWhop')}>
                  <div className="flex items-center justify-end">AI CEOS Revenue <SortIcon field="totalSpentWhop" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentSheet')}>
                  <div className="flex items-center justify-end">Sheet Revenue <SortIcon field="totalSpentSheet" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentElective')}>
                  <div className="flex items-center justify-end">Elective Revenue <SortIcon field="totalSpentElective" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('lastPaymentDate')}>
                  <div className="flex items-center">Last Activity <SortIcon field="lastPaymentDate" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedUsers.map((user) => {
                const ghlData = user.ghlData;
                const contact = ghlData?.contact;
                const opportunities = ghlData?.opportunities || [];
                const activeOpp = opportunities.find((o: any) => o.status === 'open') || opportunities[0];
                const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (Number(opp.monetaryValue) || 0), 0);
                const appointments = ghlData?.appointments || [];
                const latestAppt = appointments.length > 0 ? [...appointments].sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())[0] : null;

                return (
                  <tr key={user.email} className="hover:bg-blue-50/30 transition-colors group cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">{(user.name || user.username) ? (user.name || user.username).charAt(0) : '?'}</div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">{user.name || user.username || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-700">{contact?.phone || '-'}</span>
                    </td>
                    <td className="px-6 py-5"><p className="text-xs text-gray-500 font-medium">{user.email}</p></td>
                    <td className="px-6 py-5">
                      {opportunities.length > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">${totalValue.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{opportunities.length} Opps</span>
                        </div>
                      ) : <span className="text-sm text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-5">
                      {activeOpp ? (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${activeOpp.status === 'open' ? 'bg-blue-100 text-blue-700' : activeOpp.status === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                          {activeOpp.status}
                        </span>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-5">
                      {appointments.length > 0 ? (
                        <div className="flex flex-col">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase w-fit ${latestAppt?.appointmentStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                            {latestAppt?.appointmentStatus}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold mt-1">{new Date(latestAppt?.startTime).toLocaleDateString()}</span>
                        </div>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {user.companies?.map((company: string) => (
                          <span key={company} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase">{company}</span>
                        ))}
                        {user.ghlData && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[8px] font-black uppercase">GHL</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-blue-600">{user.ghlStageName || '-'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium text-gray-700">{user.ghlPipelineName || '-'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-700">{user.ghlAssignedToName || 'Unassigned'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] text-gray-400 font-medium">{contact?.dateAdded ? new Date(contact.dateAdded).toLocaleDateString() : '-'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {contact?.tags?.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-900">${user.totalSpentWhop.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-bold text-gray-600">${user.totalSpentSheet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-black text-purple-600">${(user.totalSpentElective || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5"><p className="text-xs font-bold text-gray-700">{user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : 'N/A'}</p></td>
                    <td className="px-6 py-5"><button className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-blue-600"><ExternalLink className="w-4 h-4" /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
