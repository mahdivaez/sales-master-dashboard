'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, ExternalLink, Mail, User, Database, Sheet, ArrowUp, ArrowDown, ArrowUpDown, Zap, CreditCard } from 'lucide-react';
import { UnifiedUserModal } from './UnifiedUserModal';
import { getAccessToken, isAuthenticated } from '@/lib/ghl-client';

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
  const [ghlDataMap, setGhlDataMap] = useState<Record<string, any>>({});
  const [isGhlAuthenticated, setIsGhlAuthenticated] = useState(false);

  useEffect(() => {
    setIsGhlAuthenticated(isAuthenticated());
  }, []);

  const fetchGhlForUser = async (email: string) => {
    if (ghlDataMap[email]) return;

    const token = getAccessToken();
    const locId = localStorage.getItem('ghl_location_id');
    
    // If no client-side token, we still want to try the server-side fetch 
    // which might use the environment variable token
    
    try {
      console.log(`Fetching GHL data for user: ${email}`);
      const res = await fetch(`/api/ghl/user-data?email=${encodeURIComponent(email)}&locationId=${locId || ''}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      console.log(`GHL Data fetched for ${email}:`, data);
      
      // Map the data to match the structure expected by the modal and table
      const formattedData = {
        ...data,
        // Ensure pipelines and users are available for name resolution
        ghlUsers: data.ghlUsers || [],
        pipelines: data.pipelines || []
      };
      
      setGhlDataMap(prev => ({ ...prev, [email]: formattedData }));
    } catch (err) {
      console.error('Error fetching GHL data for user:', email, err);
    }
  };

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
    // Search is now handled server-side, but we keep a simple client-side filter for immediate feedback
    const matchesSearch = (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Check for Whop activity (payments or memberships)
    const hasWhopActivity = (user.totalSpentWhop > 0) || 
                           (user.whopData?.payments && user.whopData.payments.length > 0) || 
                           (user.whopData?.memberships && user.whopData.memberships.length > 0) ||
                           (user.whopData?.member);
                        
    // Check for Sheet activity (Cash Collected entries)
    const hasSheetActivity = (user.totalSpentSheet > 0) || 
                            (user.sheetData && user.sheetData.length > 0);

    // Check for Elective activity
    const hasElectiveActivity = (user.totalSpentElective > 0) ||
                               (user.electiveData && user.electiveData.length > 0);

    // A user is "empty" if they have NO Whop activity AND NO Sheet activity AND NO Elective activity
    // We ignore Pipeline data for this specific filter as requested
    const hasNoFinancialData = !hasWhopActivity && !hasSheetActivity && !hasElectiveActivity;

    return matchesSearch && !hasNoFinancialData;
  });

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

  const getGhlStageName = (ghlData: any, pipelineId: string, stageId: string) => {
    if (ghlData?.ghlStageName && ghlData.ghlStageName !== 'Unknown') return ghlData.ghlStageName;
    if (!ghlData?.pipelines) return 'Unknown';
    const pipeline = ghlData.pipelines.find((p: any) => p.id === pipelineId);
    const stage = pipeline?.stages?.find((s: any) => s.id === stageId);
    return stage ? stage.name : 'Unknown';
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
        <div className="min-w-[1600px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th 
                  className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stage</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pipeline</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Assigned To</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Created</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</th>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('totalSpentWhop')}
                >
                  <div className="flex items-center justify-end">
                    AI CEOS Revenue <SortIcon field="totalSpentWhop" />
                  </div>
                </th>
                <th
                  className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('totalSpentSheet')}
                >
                  <div className="flex items-center justify-end">
                    Sheet Revenue <SortIcon field="totalSpentSheet" />
                  </div>
                </th>
                <th
                  className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('totalSpentElective')}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center">
                      <CreditCard className="w-2.5 h-2.5 text-purple-600" />
                    </div>
                    Elective Revenue <SortIcon field="totalSpentElective" />
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors"
                  onClick={() => handleSort('lastPaymentDate')}
                >
                  <div className="flex items-center">
                    Last Activity <SortIcon field="lastPaymentDate" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sortedUsers.map((user) => {
                const ghlData = user.ghlData || ghlDataMap[user.email];
                const ghlContact = ghlData?.contact || (ghlData?.id ? ghlData : null);
                const opportunities = ghlData?.opportunities || [];
                const activeOpp = opportunities.find((o: any) => o.status === 'open') || opportunities[0];
                const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (Number(opp.monetaryValue) || 0), 0);
                
                return (
                  <tr 
                    key={user.email} 
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedUser(user);
                      fetchGhlForUser(user.email);
                    }}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold text-xs">
                          {user.name ? user.name.charAt(0) : '?'}
                        </div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm">{user.name || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-gray-700">
                        {ghlContact?.type || (ghlContact?.id ? 'Contact' : '-')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                    </td>
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
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          activeOpp.status === 'open' ? 'bg-blue-100 text-blue-700' : 
                          activeOpp.status === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {activeOpp.status}
                        </span>
                      ) : <span className="text-xs text-gray-400">-</span>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {user.source.includes('Whop') && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[8px] font-black uppercase">Whop</span>
                        )}
                        {user.source.includes('Sheet') && (
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase">Sheet</span>
                        )}
                        {user.source.includes('Elective') && (
                          <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded text-[8px] font-black uppercase">Elective</span>
                        )}
                        {(user.source.includes('GHL') || ghlContact?.id) && (
                          <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[8px] font-black uppercase">GHL</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-bold text-blue-600">
                        {user.ghlStageName && user.ghlStageName !== 'Unknown' ? user.ghlStageName : (activeOpp ? getGhlStageName(ghlData, activeOpp.pipelineId, activeOpp.pipelineStageId) : '-')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium text-gray-700">
                        {user.ghlPipelineName && user.ghlPipelineName !== 'Unknown' ? user.ghlPipelineName : (activeOpp ? (ghlData?.pipelines?.find((p: any) => p.id === activeOpp.pipelineId)?.name || 'Unknown') : '-')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {(() => {
                        const assignedToName = user.ghlAssignedToName;
                        if (assignedToName && assignedToName !== 'Unknown') return <span className="text-xs font-bold text-gray-700">{assignedToName}</span>;
                        
                        const assignedToId = activeOpp?.assignedTo || ghlContact?.assignedTo;
                        const assignedUser = ghlData?.ghlUsers?.find((u: any) => u.id === assignedToId);
                        if (!assignedToId) return <span className="text-xs text-gray-400 italic">Unassigned</span>;
                        return <span className="text-xs font-bold text-gray-700">{assignedUser ? (assignedUser.name || `${assignedUser.firstName} ${assignedUser.lastName}`) : 'Unknown'}</span>;
                      })()}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {ghlContact?.dateAdded ? new Date(ghlContact.dateAdded).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {(ghlContact?.tags || []).slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-gray-900">
                          ${user.totalSpentWhop.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-600">
                      ${user.totalSpentSheet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-black text-purple-600">
                          ${(user.totalSpentElective || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        {user.electiveData && user.electiveData.length > 0 && (
                          <span className="text-[9px] font-bold text-purple-400 uppercase tracking-tighter">
                            {user.electiveData.length} {user.electiveData.length === 1 ? 'Sale' : 'Sales'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold text-gray-700">
                        {user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <button className="p-1.5 hover:bg-white rounded-lg transition-colors text-gray-400 hover:text-blue-600">
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <UnifiedUserModal
          user={{
            ...selectedUser,
            ghlData: ghlDataMap[selectedUser.email]
          }}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

