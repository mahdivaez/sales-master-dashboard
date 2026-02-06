'use client';

import React, { useState } from 'react';
import { Search, ChevronDown, Check, X, Pencil } from 'lucide-react';

interface SimpleUserTableProps {
  data: any[];
  searchTerm: string;
  onEdit: (user: any) => void;
  closers: string[];
  setters: string[];
}

export default function SimpleUserTable({ data, searchTerm, onEdit, closers, setters }: SimpleUserTableProps) {
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'closer' | 'setter' } | null>(null);
  const [localValues, setLocalValues] = useState<{ [key: string]: { closer?: string; setter?: string } }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});

  // Initialize local values from data
  React.useEffect(() => {
    const newLocalValues: { [key: string]: { closer?: string; setter?: string } } = {};
    data.forEach(item => {
      newLocalValues[item.id] = {
        closer: item.closer || '',
        setter: item.setter || '',
      };
    });
    setLocalValues(newLocalValues);
  }, [data]);

  const handleEditClick = (id: string, field: 'closer' | 'setter') => {
    setEditingCell({ id, field });
  };

  const handleValueChange = (id: string, field: 'closer' | 'setter', value: string) => {
    setLocalValues(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = async (id: string, field: 'closer' | 'setter') => {
    const value = localValues[id]?.[field];
    if (!value) return;

    setSaving(prev => ({ ...prev, [id]: true }));

    try {
      const response = await fetch('/api/sheet-data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          [field]: value,
        }),
      });

      if (response.ok) {
        setEditingCell(null);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.contactName && item.contactName.toLowerCase().includes(searchLower)) ||
      (item.contactEmail && item.contactEmail.toLowerCase().includes(searchLower)) ||
      (item.closer && item.closer.toLowerCase().includes(searchLower)) ||
      (item.setter && item.setter.toLowerCase().includes(searchLower))
    );
  });

  const DropdownCell = ({ item, field, label, options }: { item: any; field: 'closer' | 'setter'; label: string; options: string[] }) => {
    const isEditing = editingCell?.id === item.id && editingCell?.field === field;
    const currentValue = localValues[item.id]?.[field] || '';
    const isSaving = saving[item.id];

    const fieldColors = field === 'closer'
      ? { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: 'ring-blue-200', hoverBg: 'hover:bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600' }
      : { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', ring: 'ring-green-200', hoverBg: 'hover:bg-green-50', iconBg: 'bg-green-100', iconText: 'text-green-600' };

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <select
            value={currentValue}
            onChange={(e) => handleValueChange(item.id, field, e.target.value)}
            className={`text-sm font-bold border-2 ${fieldColors.border} rounded-xl px-4 py-2.5 focus:ring-4 ${fieldColors.ring} focus:border-${field === 'closer' ? 'blue' : 'green'}-500 outline-none bg-white min-w-[140px] max-w-[160px] shadow-sm cursor-pointer`}
            autoFocus
          >
            <option value="">Select {label}...</option>
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <button
            onClick={() => handleSave(item.id, field)}
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
        onClick={() => handleEditClick(item.id, field)}
      >
        <span className={`text-sm font-bold min-w-[70px] ${currentValue ? fieldColors.text : 'text-gray-400'}`}>
          {currentValue || 'Not set'}
        </span>
        <div className={`p-2 rounded-lg ${fieldColors.iconBg} opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm`}>
          <Pencil className={`w-4 h-4 ${fieldColors.iconText}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50/50">
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Name</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Closer</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Setter</th>
            <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-6 py-12 text-center">
                <p className="text-gray-500 font-medium">No records found</p>
              </td>
            </tr>
          ) : (
            filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-5">
                  <p className="font-bold text-gray-900">{item.contactName || 'Unknown'}</p>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm text-gray-500 font-medium">{item.contactEmail || '-'}</p>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="font-black text-green-600">${(item.amount || 0).toLocaleString()}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-medium text-gray-700">
                    {item.date ? new Date(item.date).toLocaleDateString() : '-'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg font-bold text-xs">
                    {item.platform || '-'}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-medium text-gray-600">{item.type || '-'}</span>
                </td>
                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                  <DropdownCell item={item} field="closer" label="Closer" options={closers} />
                </td>
                <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                  <DropdownCell item={item} field="setter" label="Setter" options={setters} />
                </td>
                <td className="px-6 py-5 text-center">
                  <button
                    onClick={() => onEdit(item)}
                    className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg font-bold text-sm hover:bg-cyan-200 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}