'use client';

import React from 'react';

interface GhlOpportunitiesTableProps {
  opportunities: any[];
  customFieldsSchema: any[];
  users: any[];
  pipelines: any[];
}

export function GhlOpportunitiesTable({ opportunities, customFieldsSchema, users, pipelines }: GhlOpportunitiesTableProps) {
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unassigned';
  };

  const getPipelineName = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    return pipeline ? pipeline.name : 'Unknown';
  };

  const getStageName = (pipelineId: string, stageId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId);
    const stage = pipeline?.stages?.find((s: any) => s.id === stageId);
    return stage ? stage.name : 'Unknown';
  };

  const getSource = (opp: any) => {
    const attribution = opp.attributions?.find((a: any) => a.type === 'source');
    return attribution?.value || 'N/A';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pipeline</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {opportunities.map((opp) => (
            <tr key={opp.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{opp.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{opp.contact?.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{opp.contact?.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-green-600">${opp.monetaryValue || 0}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  opp.status === 'open' ? 'bg-blue-100 text-blue-800' :
                  opp.status === 'won' ? 'bg-green-100 text-green-800' :
                  opp.status === 'lost' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {opp.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{getSource(opp)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{getStageName(opp.pipelineId, opp.pipelineStageId)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{getPipelineName(opp.pipelineId)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{getUserName(opp.assignedTo)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">{formatDate(opp.createdAt)}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-sm text-blue-600 hover:text-blue-800">Hide Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
