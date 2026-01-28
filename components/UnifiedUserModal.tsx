'use client';

import React from 'react';
import { X, Mail, User, DollarSign, Calendar, ShieldCheck, Database, Sheet, Info, GitBranch } from 'lucide-react';

interface UnifiedUserModalProps {
  user: any;
  onClose: () => void;
}

export const UnifiedUserModal: React.FC<UnifiedUserModalProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col">
        {/* Header */}
        <div className="relative h-32 bg-blue-600 flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-16 pb-8 px-8 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user.name || 'Unknown User'}</h2>
            <div className="flex flex-wrap gap-4 mt-2">
              <p className="text-gray-500 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              {user.whopId && (
                <p className="text-gray-500 font-medium flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  AI CEOS ID: {user.whopId}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">AI CEOS Revenue (C1+C2)</p>
              <div className="flex flex-col">
                <p className="text-2xl font-black text-gray-900">${user.totalSpentWhop.toFixed(2)}</p>
                {user.totalSpentWhopBeforeFees && (
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                    <span className="line-through">${user.totalSpentWhopBeforeFees.toFixed(2)}</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold">Before Fee</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Sheet Revenue</p>
              <p className="text-2xl font-black text-emerald-600">${user.totalSpentSheet.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI CEOS Data Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  AI CEOS Data
                </h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {user.whopData.payments.length} Payments
                </span>
              </div>

              {user.whopData.member || user.whopData.payments.length > 0 ? (
                <div className="space-y-4">
                  {user.whopData.member && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Active Memberships</p>
                      <div className="space-y-2">
                        {user.whopData.memberships.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-50">
                            <span className="font-bold text-sm text-gray-700">{m.product.title}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {m.status}
                            </span>
                          </div>
                        ))}
                        {user.whopData.memberships.length === 0 && (
                          <p className="text-sm text-gray-400 italic">No memberships found</p>
                        )}
                      </div>
                    </div>
                  )}

                  {user.whopData.payments.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase mb-2">Payment History</p>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {user.whopData.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border border-gray-50">
                            <div>
                              <p className="font-bold text-sm text-gray-700">${p.usd_total.toFixed(2)}</p>
                              <p className="text-[10px] text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{p.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                  <p className="text-gray-400 font-medium">No AI CEOS account linked to this email</p>
                </div>
              )}
            </div>

            {/* Sheet Data Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <Sheet className="w-5 h-5 text-emerald-600" />
                  Google Sheet Data
                </h3>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {user.sheetData.length} Entries
                </span>
              </div>

              <div className="space-y-4">
                {user.sheetData.length > 0 ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {user.sheetData.map((row: any, idx: number) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-black text-gray-900 text-lg">{row.amount}</p>
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{row.type || 'Payment'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase">{row.date}</p>
                            <p className="text-[10px] text-gray-500">{row.platform || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                          <div>
                            <p className="text-gray-400 font-bold uppercase mb-0.5">Closer</p>
                            <p className="text-gray-700 font-medium">{row.closer || '-'}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 font-bold uppercase mb-0.5">Setter</p>
                            <p className="text-gray-700 font-medium">{row.setter || '-'}</p>
                          </div>
                        </div>
                        {row.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-50">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Notes</p>
                            <p className="text-xs text-gray-600 italic">{row.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                    <p className="text-gray-400 font-medium">No Google Sheet entries for this email</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pipeline Data Section */}
          {user.pipelineData && user.pipelineData.length > 0 && (
            <div className="mt-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-500" />
                  Pipeline Stage Data History
                </h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {user.pipelineData.length} Stages
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.pipelineData.map((row: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-black text-gray-900 text-base">{row.stage}</p>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">{row.pipelineName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">{row.date}</p>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          row.status === 'open' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <p className="text-gray-400 font-bold uppercase">Closer:</p>
                      <p className="text-gray-700 font-medium">{row.closer || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
