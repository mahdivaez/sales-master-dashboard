'use client';

import React, { useState } from 'react';

interface GhlContactsTableProps {
  contacts: any[];
  customFieldsSchema: any[];
}

export function GhlContactsTable({ contacts, customFieldsSchema }: GhlContactsTableProps) {
  const [expandedContactId, setExpandedContactId] = useState<string | null>(null);

  const getCustomFieldLabel = (id: string) => {
    const field = customFieldsSchema.find(f => f.id === id);
    return field ? field.name : id;
  };

  const getSource = (contact: any) => {
    return contact.source || 'N/A';
  };

  const getAttribution = (contact: any) => {
    return contact.attributions?.find((a: any) => a.isFirst) || contact.attributions?.[0];
  };

  const getLocation = (contact: any) => {
    const parts = [contact.city, contact.state, contact.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source & Attribution</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location & Timezone</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tags</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {contacts.map((contact) => {
            const attr = getAttribution(contact);
            const isExpanded = expandedContactId === contact.id;

            return (
              <React.Fragment key={contact.id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">{contact.contactName || `${contact.firstName} ${contact.lastName}`}</span>
                      <span className="text-xs text-gray-500">{contact.email}</span>
                      {contact.phone && <span className="text-xs text-gray-400">{contact.phone}</span>}
                      <span className={`mt-1 inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-medium ${contact.type === 'lead' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {contact.type?.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-medium text-gray-700">
                        <span className="text-gray-400">Source:</span> {getSource(contact)}
                      </div>
                      {attr && (
                        <div className="flex flex-wrap gap-x-2 gap-y-1">
                          {attr.utmSource && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">src: {attr.utmSource}</span>}
                          {attr.utmMedium && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">med: {attr.utmMedium}</span>}
                          {attr.utmCampaign && <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">cmp: {attr.utmCampaign}</span>}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-gray-700">{getLocation(contact)}</span>
                      <span className="text-[10px] text-gray-400">{contact.timezone || 'No Timezone'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {contact.tags?.slice(0, 3).map((tag: string) => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] rounded-full border border-blue-100">
                          {tag}
                        </span>
                      ))}
                      {contact.tags?.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{contact.tags.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-gray-500">
                    {formatDate(contact.dateAdded)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button 
                      onClick={() => setExpandedContactId(isExpanded ? null : contact.id)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline decoration-dotted"
                    >
                      {isExpanded ? 'Hide Details' : 'View All Data'}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="bg-gray-50">
                    <td colSpan={6} className="px-8 py-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Custom Fields */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Custom Fields</h4>
                          <div className="space-y-2">
                            {contact.customFields && contact.customFields.length > 0 ? (
                              contact.customFields.map((cf: any) => (
                                <div key={cf.id} className="flex flex-col border-b border-gray-200 pb-1">
                                  <span className="text-[10px] text-gray-500">{getCustomFieldLabel(cf.id)}</span>
                                  <span className="text-xs font-medium text-gray-800 break-all">{cf.value || '—'}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">No custom fields</span>
                            )}
                          </div>
                        </div>

                        {/* Full Attribution */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Full Attribution</h4>
                          {contact.attributions?.map((a: any, idx: number) => (
                            <div key={idx} className="mb-4 p-3 bg-white rounded border border-gray-200 text-xs">
                              <div className="font-bold text-blue-600 mb-1">{a.isFirst ? 'First Touch' : 'Touchpoint'}</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><span className="text-gray-400">Source:</span> {a.utmSource || '—'}</div>
                                <div><span className="text-gray-400">Medium:</span> {a.utmMedium || '—'}</div>
                                <div className="col-span-2"><span className="text-gray-400">Campaign:</span> {a.utmCampaign || '—'}</div>
                                <div className="col-span-2"><span className="text-gray-400">Content:</span> {a.utmContent || '—'}</div>
                                <div className="col-span-2"><span className="text-gray-400">URL:</span> <a href={a.url} target="_blank" className="text-blue-500 truncate block">{a.url}</a></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* System Info */}
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">System Info</h4>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between"><span className="text-gray-500">GHL ID:</span> <span className="font-mono">{contact.id}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">DND:</span> <span>{contact.dnd ? 'Yes' : 'No'}</span></div>
                            <div className="flex justify-between"><span className="text-gray-500">Updated:</span> <span>{formatDate(contact.dateUpdated)}</span></div>
                            <div className="mt-4">
                              <span className="text-gray-500 block mb-1">All Tags:</span>
                              <div className="flex flex-wrap gap-1">
                                {contact.tags?.map((tag: string) => (
                                  <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
