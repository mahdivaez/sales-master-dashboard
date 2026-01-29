'use client';

import React from 'react';
import { X, Mail, User, DollarSign, Calendar, ShieldCheck, Database, Sheet, Info, GitBranch, Zap, Phone, Tag } from 'lucide-react';

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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
              <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">GHL Opportunity Value</p>
              {(() => {
                const ghlData = user.ghlData;
                const opportunities = ghlData?.opportunities || [];
                const totalValue = opportunities.reduce((sum: number, opp: any) => sum + (Number(opp.monetaryValue) || 0), 0);
                
                if (!ghlData && !user.ghlActiveOpp) {
                  return <p className="text-sm text-gray-400 italic animate-pulse">Loading GHL data...</p>;
                }

                return (
                  <div className="flex flex-col">
                    <p className="text-2xl font-black text-orange-600">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{opportunities.length} Opportunities</p>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

            {/* GHL Data Section */}
            <div className="space-y-6">
              {(() => {
                const ghlData = user.ghlData;
                const contact = ghlData?.contact || (ghlData?.id ? ghlData : null);
                const opportunities = ghlData?.opportunities || [];
                
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-orange-500" />
                        GHL CRM Data
                      </h3>
                      <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                        {opportunities.length} Opps
                      </span>
                    </div>

                    {contact ? (
                      <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-3">Contact Info</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="font-bold text-gray-700">{contact.firstName} {contact.lastName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">{contact.phone || 'No phone'}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.tags?.map((tag: string) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-orange-50 text-orange-700 text-[8px] font-bold rounded uppercase">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          <p className="text-xs font-bold text-gray-400 uppercase">Opportunities</p>
                          {opportunities.length > 0 ? (
                            opportunities.map((opp: any) => (
                              <div key={opp.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-bold text-gray-900 text-sm">{opp.name}</p>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase">
                                      {(() => {
                                        const pipeline = ghlData.pipelines?.find((p: any) => p.id === opp.pipelineId);
                                        const stage = pipeline?.stages?.find((s: any) => s.id === opp.pipelineStageId);
                                        return stage ? stage.name : 'No Stage';
                                      })()}
                                    </p>
                                  </div>
                                  <p className="font-black text-green-600 text-sm">${(Number(opp.monetaryValue) || 0).toLocaleString()}</p>
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                    opp.status === 'open' ? 'bg-blue-100 text-blue-700' : 
                                    opp.status === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {opp.status}
                                  </span>
                                  <span className="text-[9px] text-gray-400">{new Date(opp.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-gray-400 italic">No opportunities found</p>
                          )}
                        </div>
                      </div>
                    ) : !ghlData && !user.ghlActiveOpp ? (
                      <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                        <p className="text-gray-400 font-medium animate-pulse">Fetching GHL data...</p>
                      </div>
                    ) : (
                      <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                        <p className="text-gray-400 font-medium">No GHL contact found</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Pipeline Data Section */}
          {user.pipelineData && user.pipelineData.length > 0 && (
            <div className="mt-8 space-y-6 border-t border-gray-100 pt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-blue-500" />
                  Pipeline Stage Data History
                </h3>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {user.pipelineData.length} Stages
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          {/* GHL Data Section */}
          {(() => {
            const ghlData = user.ghlData;
            const contact = ghlData?.contact || (ghlData?.id ? ghlData : null);
            if (!contact) return null;

            return (
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-orange-500" />
                    GoHighLevel CRM Data
                  </h3>
                  <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {ghlData.opportunities?.length || 0} Opportunities
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Info */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-4">Contact Details</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {contact.firstName} {contact.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {contact.phone || 'No phone'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] font-bold rounded-full">
                              {tag}
                            </span>
                          )) || <span className="text-gray-400 italic">No tags</span>}
                        </div>
                      </div>
                      {contact.dateAdded && (
                        <div className="flex items-center gap-3 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            Added: {new Date(contact.dateAdded).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Source & Attribution */}
                    {(contact.source || contact.attributionSource) && (
                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Source & Attribution</p>
                        <div className="grid grid-cols-1 gap-3">
                          {contact.source && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Source</span>
                              <span className="text-sm font-medium text-gray-700">
                                {(() => {
                                  if (typeof contact.source === 'object' && contact.source !== null) {
                                    const s = contact.source;
                                    return [s.sessionSource, s.medium, s.campaign].filter(Boolean).join(' / ') || JSON.stringify(s);
                                  }
                                  return String(contact.source);
                                })()}
                              </span>
                            </div>
                          )}
                          {contact.attributionSource && (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">Attribution</span>
                              <span className="text-sm font-medium text-gray-700">
                                {(() => {
                                  if (typeof contact.attributionSource === 'object' && contact.attributionSource !== null) {
                                    const s = contact.attributionSource;
                                    return [s.sessionSource, s.medium, s.campaign].filter(Boolean).join(' / ') || JSON.stringify(s);
                                  }
                                  return String(contact.attributionSource);
                                })()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Custom Fields */}
                    {/* {contact.customFields && contact.customFields.length > 0 && (
                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Custom Fields</p>
                        <div className="grid grid-cols-1 gap-3">
                          {contact.customFields.map((cf: any) => {
                            const schema = ghlData.customFieldsSchema?.find((s: any) => s.id === cf.id);
                            const label = schema?.name || cf.id;
                            if (!cf.value) return null;
                            return (
                              <div key={cf.id} className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {typeof cf.value === 'object' ? JSON.stringify(cf.value) : String(cf.value)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )} */}
                  </div>

                  {/* Opportunities */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-4">Active Opportunities</p>
                    <div className="space-y-3">
                      {ghlData.opportunities?.length > 0 ? (
                        ghlData.opportunities.map((opp: any) => (
                          <div key={opp.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-sm text-gray-900">{opp.name}</p>
                                <p className="text-[10px] text-gray-500 font-medium">
                                  {(() => {
                                    const pipeline = ghlData.pipelines?.find((p: any) => p.id === opp.pipelineId);
                                    return pipeline ? pipeline.name : 'Pipeline';
                                  })()}
                                </p>
                                <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">
                                  {(() => {
                                    const pipeline = ghlData.pipelines?.find((p: any) => p.id === opp.pipelineId);
                                    const stage = pipeline?.stages?.find((s: any) => s.id === opp.pipelineStageId);
                                    return stage ? stage.name : 'No Stage';
                                  })()}
                                </p>
                              </div>
                              <p className="font-black text-green-600 text-sm">${opp.monetaryValue || 0}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100/50">
                              <div className="flex flex-col">
                                <span className="text-[8px] text-gray-400 font-bold uppercase">Assigned To</span>
                                <span className="text-[10px] font-bold text-gray-600">
                                  {(() => {
                                    const assignedUser = ghlData.ghlUsers?.find((u: any) => u.id === opp.assignedTo);
                                    return assignedUser ? (assignedUser.name || `${assignedUser.firstName} ${assignedUser.lastName}`) : 'Unassigned';
                                  })()}
                                </span>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                opp.status === 'open' ? 'bg-blue-100 text-blue-700' : 
                                opp.status === 'won' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {opp.status}
                              </span>
                            </div>
                            <div className="mt-2 text-right">
                              <span className="text-[10px] font-medium text-gray-400">
                                Created: {new Date(opp.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">No opportunities found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
