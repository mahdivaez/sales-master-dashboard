import React, { useState } from 'react';
import { GhlCustomFields } from './GhlCustomFields';

interface GhlOpportunitiesTableProps {
  opportunities: any[];
  customFieldsSchema: any[];
  users?: any[];
  pipelines?: any[];
}

export function GhlOpportunitiesTable({ opportunities, customFieldsSchema, users = [], pipelines = [] }: GhlOpportunitiesTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getUserName = (userId: string) => {
    const user = users.find((u: any) => u.id === userId);
    return user ? user.name : userId || 'Unassigned';
  };

  const getPipelineName = (pipelineId: string) => {
    const pipeline = pipelines.find((p: any) => p.id === pipelineId);
    return pipeline ? pipeline.name : pipelineId || 'N/A';
  };

  const getStageName = (pipelineId: string, stageId: string) => {
    const pipeline = pipelines.find((p: any) => p.id === pipelineId);
    const stage = pipeline?.stages?.find((s: any) => s.id === stageId);
    return stage ? stage.name : stageId || 'N/A';
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'contactName', label: 'Contact' },
    { key: 'email', label: 'Email' },
    { key: 'monetaryValue', label: 'Value' },
    { key: 'status', label: 'Status' },
    { key: 'source', label: 'Source' },
    { key: 'stageName', label: 'Stage' },
    { key: 'pipelineName', label: 'Pipeline' },
    { key: 'assignedUserName', label: 'Assigned To' },
    { key: 'createdAt', label: 'Created' },
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (value: number) => {
    return value ? `$${value.toLocaleString()}` : '$0';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse bg-white shadow-sm">
        <thead>
          <tr className="bg-gray-100">
            {columns.map(col => (
              <th key={col.key} className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">
                {col.label}
              </th>
            ))}
            <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Actions</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity, i) => (
            <React.Fragment key={opportunity.id}>
              <tr className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{opportunity.name || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{opportunity.contact?.name || opportunity.relations?.[0]?.contactName || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{opportunity.contact?.email || opportunity.relations?.[0]?.email || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{formatCurrency(opportunity.monetaryValue)}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">
                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                   opportunity.status === 'open' ? 'bg-green-500 text-white' :
                   opportunity.status === 'won' ? 'bg-blue-500 text-white' :
                   'bg-red-500 text-white'
                 }`}>
                   {opportunity.status || 'N/A'}
                 </span>
               </td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{opportunity.source || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getStageName(opportunity.pipelineId, opportunity.pipelineStageId)}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getPipelineName(opportunity.pipelineId)}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getUserName(opportunity.assignedTo)}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{formatDate(opportunity.createdAt)}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">
                  <button className="px-2 py-1 bg-blue-500 text-white text-sm" onClick={() => toggleExpanded(opportunity.id)}>
                    {expanded[opportunity.id] ? 'Hide' : 'Show'} Details
                  </button>
                </td>
              </tr>
              {expanded[opportunity.id] && (
                <tr>
                  <td colSpan={columns.length + 1} className="border border-gray-300 px-4 py-3">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-4 text-lg">Opportunity Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                            <div className="text-blue-800 font-medium text-sm mb-1">ID</div>
                            <div className="text-blue-900 font-mono text-sm">{opportunity.id}</div>
                          </div>
                          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200 shadow-sm">
                            <div className="text-green-800 font-medium text-sm mb-1">Pipeline</div>
                            <div className="text-green-900 text-sm">{getPipelineName(opportunity.pipelineId)}</div>
                          </div>
                          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                            <div className="text-purple-800 font-medium text-sm mb-1">Assigned To</div>
                            <div className="text-purple-900 text-sm">{getUserName(opportunity.assignedTo)}</div>
                          </div>
                          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200 shadow-sm">
                            <div className="text-orange-800 font-medium text-sm mb-1">Last Status Change</div>
                            <div className="text-orange-900 text-sm">{formatDate(opportunity.lastStatusChangeAt)}</div>
                          </div>
                          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200 shadow-sm">
                            <div className="text-indigo-800 font-medium text-sm mb-1">Last Stage Change</div>
                            <div className="text-indigo-900 text-sm">{formatDate(opportunity.lastStageChangeAt)}</div>
                          </div>
                          <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200 shadow-sm">
                            <div className="text-pink-800 font-medium text-sm mb-1">Updated At</div>
                            <div className="text-pink-900 text-sm">{formatDate(opportunity.updatedAt)}</div>
                          </div>
                        </div>
                      </div>
                      {opportunity.customFields && opportunity.customFields.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Custom Fields</h4>
                          <div className="bg-gray-50 p-4 rounded">
                            <GhlCustomFields customFields={opportunity.customFields} customFieldsSchema={customFieldsSchema} />
                          </div>
                        </div>
                      )}
                      {opportunity.attributions && opportunity.attributions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Attributions</h4>
                          <div className="space-y-3">
                            {opportunity.attributions.map((attr: any, idx: number) => (
                              <div key={idx} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="text-sm text-gray-800 space-y-1">
                                  <div><strong>Source:</strong> {attr.utmSource || 'N/A'}</div>
                                  <div><strong>Campaign:</strong> {attr.utmCampaign || 'N/A'}</div>
                                  <div><strong>Medium:</strong> {attr.medium || 'N/A'}</div>
                                  <div><strong>Session Source:</strong> {attr.utmSessionSource || 'N/A'}</div>
                                  {attr.isFirst && <div className="text-green-600 font-medium">First Touch</div>}
                                  {attr.isLast && <div className="text-blue-600 font-medium">Last Touch</div>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}