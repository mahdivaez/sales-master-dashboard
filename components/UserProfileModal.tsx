'use client';

import React from 'react';
import { X, Mail, User, DollarSign, Calendar, ShieldCheck } from 'lucide-react';
import { UnifiedUser } from '@/types';

interface UserProfileModalProps {
  user: UnifiedUser;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="relative h-32 bg-blue-600">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
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
        <div className="pt-16 pb-8 px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{user.name || user.username}</h2>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {user.email}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Lifetime Value</p>
              <p className="text-xl font-black text-blue-600">${user.totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-2xl">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Active Memberships</p>
              <p className="text-xl font-black text-emerald-600">
                {user.memberships.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Memberships
              </h3>
              <div className="space-y-3">
                {user.memberships.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div>
                      <p className="font-bold text-gray-900">{m.product.title}</p>
                      <p className="text-xs text-gray-500 font-medium">ID: {m.id}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Recent Payments
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {user.payments.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">${p.usd_total.toFixed(2)}</p>
                        <p className="text-[10px] text-gray-500 font-medium">
                          {new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{p.substatus}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
