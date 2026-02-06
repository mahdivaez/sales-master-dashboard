'use client';

import React from 'react';
import { X, Mail, User, DollarSign, Calendar, ShieldCheck, Database, Sheet, Info, GitBranch, Zap, Phone, Tag, CreditCard, ExternalLink, TrendingUp, Clock, MapPin } from 'lucide-react';

interface UnifiedUserModalProps {
  user: any;
  onClose: () => void;
}

export const UnifiedUserModal: React.FC<UnifiedUserModalProps> = ({ user, onClose }) => {
  const ghlData = user.ghlData;
  const contact = ghlData?.contact || (ghlData?.id ? ghlData : null);
  const opportunities = ghlData?.opportunities || [];
  const appointments = ghlData?.appointments || [];
  const totalGhlValue = opportunities.reduce((sum: number, opp: any) => sum + (Number(opp.monetaryValue) || 0), 0);
  
  const totalRevenue = (user.totalSpentWhop || 0) + (user.totalSpentElective || 0) + (user.totalSpentFanbasis || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-gray-900/60 backdrop-blur-md">
      <div className="bg-[#F8FAFC] rounded-[2.5rem] shadow-2xl w-full max-w-[98vw] xl:max-w-[1600px] h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col border border-white/20">
        
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{user.name || 'Unknown User'}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {user.email}
                </span>
                {user.whopId && (
                  <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-bold uppercase tracking-wider">
                   WHOP-ID: {user.whopId}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-black text-emerald-700">Total Revenue: ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <button 
              onClick={onClose}
              className="p-3 bg-gray-50 hover:bg-red-50 hover:text-red-500 rounded-2xl text-gray-400 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Main Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Database className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Whop</p>
              </div>
              <p className="text-3xl font-black text-gray-900">${user.totalSpentWhop.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">{user.whopData.payments.length} Transactions</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                  <Sheet className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Sheet Revenue</p>
              </div>
              <p className="text-3xl font-black text-gray-900">${user.totalSpentSheet.toFixed(2)}</p>
              <p className="text-[10px] font-bold text-emerald-400 mt-1 uppercase">{user.sheetData.length} Entries</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Elective</p>
              </div>
              <p className="text-3xl font-black text-gray-900">${(user.totalSpentElective || 0).toFixed(2)}</p>
              <p className="text-[10px] font-bold text-purple-400 mt-1 uppercase">{user.electiveData?.length || 0} Sales</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center text-cyan-600">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Fanbasis</p>
              </div>
              <p className="text-3xl font-black text-gray-900">${(user.totalSpentFanbasis || 0).toFixed(2)}</p>
              <p className="text-[10px] font-bold text-cyan-400 mt-1 uppercase">{user.fanbasisData?.length || 0} Sales</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                  <Zap className="w-5 h-5" />
                </div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">GHL Value</p>
              </div>
              <p className="text-3xl font-black text-gray-900">${totalGhlValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              <p className="text-[10px] font-bold text-orange-400 mt-1 uppercase">{opportunities.length} Opportunities</p>
            </div>
          </div>

          {/* Data Comparison Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
            
            {/* Column 1: AI CEOS & CRM Info */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" /> Whop Sales
                  </h3>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4 shadow-sm">
                  {user.whopData.memberships.length > 0 ? (
                    user.whopData.memberships.map((m: any) => (
                      <div key={m.id} className="p-3 bg-indigo-50/30 rounded-2xl border border-indigo-50">
                        <p className="text-xs font-black text-gray-900">{m.product.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">Membership</span>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                            m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 italic text-center py-4">No active memberships</p>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" /> CRM Profile
                  </h3>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm">
                  {contact ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                          <Phone className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
                          <p className="text-xs font-bold text-gray-700">{contact.phone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Tag className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags?.map((tag: string) => (
                              <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[8px] font-black rounded-lg uppercase">
                                {tag}
                              </span>
                            )) || <span className="text-[10px] text-gray-400 italic">No tags</span>}
                          </div>
                        </div>
                      </div>
                      {contact.dateAdded && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                            <Clock className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Added On</p>
                            <p className="text-xs font-bold text-gray-700">{new Date(contact.dateAdded).toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic text-center py-4">No CRM profile found</p>
                  )}
                </div>
              </section>
            </div>

            {/* Column 2: Sheet Data */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Sheet className="w-4 h-4 text-emerald-600" /> Sheet Entries
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {user.sheetData.length > 0 ? (
                  user.sheetData.map((row: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black text-gray-900 text-lg">{row.amount}</p>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{row.date}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-gray-400 font-bold uppercase mb-0.5">Closer</p>
                          <p className="text-gray-700 font-black truncate">{row.closer || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded-lg">
                          <p className="text-gray-400 font-bold uppercase mb-0.5">Setter</p>
                          <p className="text-gray-700 font-black truncate">{row.setter || '-'}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded-lg col-span-2">
                          <p className="text-gray-400 font-bold uppercase mb-0.5">Portal</p>
                          <p className="text-gray-700 font-black truncate">{row.portal || '-'}</p>
                        </div>
                      </div>
                      {row.notes && (
                        <p className="text-[10px] text-gray-500 italic line-clamp-2 group-hover:line-clamp-none transition-all">{row.notes}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 font-medium">No sheet entries</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: Elective Data */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" /> Elective Sales
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {user.electiveData && user.electiveData.length > 0 ? (
                  user.electiveData.map((row: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-purple-200 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-gray-900 text-lg leading-none">${row.netAmount.toFixed(2)}</p>
                          <p className="text-[9px] font-bold text-purple-500 uppercase mt-1">{row.checkoutName || 'Sale'}</p>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{row.saleDate}</span>
                      </div>
                      <div className="flex items-center justify-between bg-purple-50/50 p-2 rounded-xl mb-2">
                        <div className="text-center flex-1">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Total</p>
                          <p className="text-[10px] font-black text-gray-700">${(row.orderTotal || 0).toFixed(2)}</p>
                        </div>
                        <div className="w-px h-4 bg-purple-100"></div>
                        <div className="text-center flex-1">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Fees</p>
                          <p className="text-[10px] font-black text-red-400">-${(row.feesTotal || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                        <span>{row.type}</span>
                        <span>{row.term}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 font-medium">No elective sales</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 4: Fanbasis Sales */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-cyan-600" /> Fanbasis Sales
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {user.fanbasisData && user.fanbasisData.length > 0 ? (
                  user.fanbasisData.map((row: any, idx: number) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-cyan-200 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-black text-gray-900 text-lg leading-none">${row.netAmount.toFixed(2)}</p>
                          <p className="text-[9px] font-bold text-cyan-500 uppercase mt-1">{row.product || 'Sale'}</p>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(row.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center justify-between bg-cyan-50/50 p-2 rounded-xl mb-2">
                        <div className="text-center flex-1">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Customer</p>
                          <p className="text-[10px] font-black text-gray-700 truncate">{row.customerName || '-'}</p>
                        </div>
                        <div className="w-px h-4 bg-cyan-100"></div>
                        <div className="text-center flex-1">
                          <p className="text-[8px] text-gray-400 font-bold uppercase">Status</p>
                          <p className="text-[10px] font-black text-emerald-600">{row.status}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase">
                        <span>{row.paymentMethod}</span>
                        <span>{row.availableToWithdraw ? 'Withdrawable' : 'Hold'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 font-medium">No fanbasis sales</p>
                  </div>
                )}
              </div>
            </div>

            {/* Column 5: GHL Appointments */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" /> GHL Appointments
              </h3>
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {appointments.length > 0 ? (
                  appointments.map((appt: any) => (
                    <div key={appt.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-black text-gray-900 text-sm leading-tight">{appt.title}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                          appt.appointmentStatus === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                          appt.appointmentStatus === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {appt.appointmentStatus}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-[10px] font-bold text-gray-600">
                            {new Date(appt.startTime).toLocaleString()}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-gray-50 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-400 font-bold uppercase">Assigned To</span>
                            <span className="text-[10px] font-black text-gray-600">
                              {(() => {
                                const assignedUser = ghlData.ghlUsers?.find((u: any) => u.id === appt.assignedUserId);
                                return assignedUser ? (assignedUser.name || `${assignedUser.firstName} ${assignedUser.lastName}`) : 'Unassigned';
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 font-medium">No appointments</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Pipeline History (Full Width) */}
          {user.pipelineData && user.pipelineData.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2 mb-6">
                <GitBranch className="w-4 h-4 text-blue-500" /> Pipeline Stage History
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {user.pipelineData.map((row: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-black text-gray-900 text-xs">{row.stage}</p>
                      <span className="text-[9px] font-bold text-gray-400">{row.date}</span>
                    </div>
                    <p className="text-[10px] font-bold text-blue-500 uppercase mb-2">{row.pipelineName}</p>
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-gray-400 font-bold uppercase">Closer:</span>
                      <span className="text-gray-700 font-black">{row.closer || '-'}</span>
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
