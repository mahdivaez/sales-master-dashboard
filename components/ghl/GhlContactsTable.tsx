import React, { useState } from 'react';
import { GhlCustomFields } from './GhlCustomFields';

interface GhlContactsTableProps {
  contacts: any[];
  customFieldsSchema: any[];
}

export function GhlContactsTable({ contacts, customFieldsSchema }: GhlContactsTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const getCustomField = (customFields: any[], id: string) => {
    const field = customFields?.find((f: any) => f.id === id);
    return field ? field.value : 'N/A';
  };

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const columns = [
    { key: 'contactName', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'tier', label: 'Tier' },
    { key: 'setter', label: 'Setter' },
    { key: 'income', label: 'Income' },
    { key: 'investmentLevel', label: 'Investment Level' },
    { key: 'source', label: 'Source' },
    { key: 'showUp', label: 'Show Up' },
    { key: 'tags', label: 'Tags' },
  ];

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
          {contacts.map((contact, i) => (
            <React.Fragment key={contact.id}>
              <tr className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{contact.contactName || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{contact.email || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getCustomField(contact.customFields, '1LOXTxCo9Mw7lH97x9QH')}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getCustomField(contact.customFields, '4Z2GOQIXaVhnXnjlDtoR')}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getCustomField(contact.customFields, 'F4ySNhVI68ZCLbgFOdh6') || getCustomField(contact.customFields, 'tC35k8ZtQ3GgVvfrZ8xx')}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getCustomField(contact.customFields, 'FUmvewB8ivSNt38dJ2CV') || getCustomField(contact.customFields, 'qQVXl5rkR5VGI7KdYXEh')}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{contact.source || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{getCustomField(contact.customFields, 'N7W0WKRC0hcIg5x0Gane')}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">{contact.tags?.join(', ') || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-3 text-gray-900">
                  <button className="px-2 py-1 bg-blue-500 text-white text-sm" onClick={() => toggleExpanded(contact.id)}>
                    {expanded[contact.id] ? 'Hide' : 'Show'} Custom Fields
                  </button>
                </td>
              </tr>
              {expanded[contact.id] && (
                <tr>
                  <td colSpan={columns.length + 1} className="border border-gray-300 px-4 py-3">
                    <GhlCustomFields customFields={contact.customFields || []} customFieldsSchema={customFieldsSchema} />
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