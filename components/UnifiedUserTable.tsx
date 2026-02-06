'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ExternalLink, Mail, User, Database, Sheet, ArrowUp, ArrowDown, ArrowUpDown, Zap, CreditCard, Phone, Tag, Clock, Calendar, ChevronDown, Check, X, Pencil } from 'lucide-react';
import { UnifiedUserModal } from './UnifiedUserModal';

interface UnifiedUserTableProps {
  users: any[];
}

type SortField = 'name' | 'totalSpentWhop' | 'totalSpentSheet' | 'totalSpentElective' | 'totalSpentFanbasis' | 'lastPaymentDate';
type SortOrder = 'asc' | 'desc' | null;

interface Closer {
  id: string;
  name: string;
  isActive: boolean;
}

interface Setter {
  id: string;
  name: string;
  isActive: boolean;
}

export const UnifiedUserTable: React.FC<UnifiedUserTableProps> = ({ users: initialUsers }) => {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [sortField, setSortField] = useState<SortField | null>('lastPaymentDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [closersList, setClosersList] = useState<Closer[]>([]);
  const [settersList, setSettersList] = useState<Setter[]>([]);
  const [editingCell, setEditingCell] = useState<{ userId: string; field: 'closer' | 'setter'; sheetDataId: string } | null>(null);
  const [localValues, setLocalValues] = useState<{ [key: string]: { closer?: string; setter?: string } }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  // Fetch closers and setters from API on mount
  useEffect(() => {
    const fetchCloserSetter = async () => {
      try {
        const [closersRes, settersRes] = await Promise.all([
          fetch('/api/closers?active_only=true'),
          fetch('/api/setters?active_only=true'),
        ]);
        
        const closersData = await closersRes.json();
        const settersData = await settersRes.json();
        
        if (closersData.closers) {
          setClosersList(closersData.closers);
        }
        if (settersData.setters) {
          setSettersList(settersData.setters);
        }
      } catch (error) {
        console.error('Error fetching closers/setters:', error);
      }
    };
    fetchCloserSetter();
  }, []);

  // Update local values when initialUsers change
  useEffect(() => {
    const newLocalValues: { [key: string]: { closer?: string; setter?: string } } = {};
    initialUsers.forEach(user => {
      if (user.sheetData && user.sheetData.length > 0) {
        const latestSheetData = user.sheetData[0];
        newLocalValues[user.email] = {
          closer: latestSheetData.closer || '',
          setter: latestSheetData.setter || '',
        };
      }
    });
    setLocalValues(newLocalValues);
    setUsers(initialUsers);
  }, [initialUsers]);

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

    const hasFanbasisActivity = (user.totalSpentFanbasis > 0) ||
                                (user.fanbasisData && user.fanbasisData.length > 0);

    const hasGhlActivity = !!user.ghlData;

    return matchesSearch && (hasWhopActivity || hasSheetActivity || hasElectiveActivity || hasFanbasisActivity || hasGhlActivity);
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

  const handleEditClick = (user: any, field: 'closer' | 'setter') => {
    if (user.sheetData && user.sheetData.length > 0) {
      setEditingCell({ userId: user.email, field, sheetDataId: user.sheetData[0].id });
    }
  };

  const handleValueChange = (userId: string, field: 'closer' | 'setter', value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSave = async (userId: string, field: 'closer' | 'setter', sheetDataId: string) => {
    const value = localValues[userId]?.[field];
    if (!value || !sheetDataId) return;

    setSaving(prev => ({ ...prev, [sheetDataId]: true }));

    try {
      const response = await fetch('/api/sheet-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sheetDataId,
          [field]: value,
        }),
      });

      if (response.ok) {
        setEditingCell(null);
        // Update the local users state
        setUsers(prevUsers => 
          prevUsers.map(user => {
            if (user.email === userId && user.sheetData) {
              return {
                ...user,
                sheetData: user.sheetData.map((sheet: any) => 
                  sheet.id === sheetDataId 
                    ? { ...sheet, [field]: value }
                    : sheet
                ),
              };
            }
            return user;
          })
        );
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(prev => ({ ...prev, [sheetDataId]: false }));
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
    // Reset local values to original
    const newLocalValues: { [key: string]: { closer?: string; setter?: string } } = {};
    users.forEach(user => {
      if (user.sheetData && user.sheetData.length > 0) {
        const latestSheetData = user.sheetData[0];
        newLocalValues[user.email] = {
          closer: latestSheetData.closer || '',
          setter: latestSheetData.setter || '',
        };
      }
    });
    setLocalValues(newLocalValues);
  };

  const DropdownCell = ({
    user,
    field,
    label
  }: {
    user: any;
    field: 'closer' | 'setter';
    label: string;
  }) => {
    const isEditing = editingCell?.userId === user.email && editingCell?.field === field;
    const currentValue = localValues[user.email]?.[field] || '';
    const sheetDataId = user.sheetData?.[0]?.id;
    const isSaving = saving[sheetDataId];

    // Color scheme based on field type
    const fieldColors = field === 'closer'
      ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-200', hoverBg: 'hover:bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600' }
      : { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', ring: 'ring-green-200', hoverBg: 'hover:bg-green-50', iconBg: 'bg-green-100', iconText: 'text-green-600' };

    if (!user.sheetData || user.sheetData.length === 0) {
      return <span className="text-xs text-gray-400">-</span>;
    }

    if (isEditing) {
      const options = field === 'closer' ? closersList : settersList;
      return (
        <div className="flex items-center gap-2">
          <select
            value={currentValue}
            onChange={(e) => handleValueChange(user.email, field, e.target.value)}
            className={`text-sm font-bold border-2 ${fieldColors.border} rounded-xl px-4 py-2.5 focus:ring-4 ${fieldColors.ring} focus:border-${field === 'closer' ? 'blue' : 'green'}-500 outline-none bg-white min-w-[160px] max-w-[180px] shadow-sm cursor-pointer`}
            autoFocus
          >
            <option value="">Select {label}...</option>
            {options.map((opt: any) => (
              <option key={opt.id} value={opt.name}>{opt.name}</option>
            ))}
          </select>
          <button
            onClick={() => handleSave(user.email, field, sheetDataId)}
            disabled={isSaving}
            className={`p-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[44px]`}
            title="Save"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[44px]"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-transparent ${fieldColors.hoverBg} cursor-pointer transition-all duration-200 group`}
        onClick={() => handleEditClick(user, field)}
      >
        <span className={`text-sm font-bold min-w-[80px] ${currentValue ? fieldColors.text : 'text-gray-400'}`}>
          {currentValue || 'Not set'}
        </span>
        <div className={`p-2 rounded-lg ${fieldColors.iconBg} opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm`}>
          <Pencil className={`w-4 h-4 ${fieldColors.iconText}`} />
        </div>
      </div>
    );
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
        <div className="min-w-[2400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('name')}>
                  <div className="flex items-center">Name <SortIcon field="name" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentWhop')}>
                  <div className="flex items-center justify-end">AI CEOS Revenue <SortIcon field="totalSpentWhop" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentSheet')}>
                  <div className="flex items-center justify-end">Sheet Revenue <SortIcon field="totalSpentSheet" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentElective')}>
                  <div className="flex items-center justify-end">Elective Revenue <SortIcon field="totalSpentElective" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right cursor-pointer hover:text-gray-600 transition-colors" onClick={() => handleSort('totalSpentFanbasis')}>
                  <div className="flex items-center justify-end">Fanbasis Revenue <SortIcon field="totalSpentFanbasis" /></div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bookings</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Source</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Closer</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Setter</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tags</th>
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
                    <td className="px-6 py-5 text-right font-bold text-gray-900">${user.totalSpentWhop.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-bold text-gray-600">${user.totalSpentSheet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-black text-purple-600">${(user.totalSpentElective || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-5 text-right font-black text-cyan-600">${(user.totalSpentFanbasis || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <DropdownCell user={user} field="closer" label="Closer" />
                    </td>
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <DropdownCell user={user} field="setter" label="Setter" />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1 max-w-[120px]">
                        {contact?.tags?.slice(0, 2).map((tag: string, i: number) => (
                          <span key={i} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-bold uppercase">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5"><p className="text-xs font-bold text-gray-700">{user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString() : 'N/A'}</p></td>
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
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
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};
