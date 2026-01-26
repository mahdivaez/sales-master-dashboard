interface GhlCustomFieldsProps {
  customFields: any[];
  customFieldsSchema: any[];
}

export function GhlCustomFields({ customFields, customFieldsSchema }: GhlCustomFieldsProps) {
  const getFieldName = (id: string) => {
    const schemaField = customFieldsSchema.find((f: any) => f.id === id);
    return schemaField ? schemaField.name : id;
  };

  return (
    <div>
      <h3 className="font-semibold mb-2">Custom Fields</h3>
      <table className="w-full border-collapse bg-white shadow-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Field Name</th>
            <th className="border border-gray-400 px-4 py-3 text-left font-semibold text-gray-800">Value</th>
          </tr>
        </thead>
        <tbody>
          {customFields?.map((field, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border border-gray-300 px-4 py-3 text-gray-900">{getFieldName(field.id)}</td>
              <td className="border border-gray-300 px-4 py-3 text-gray-900">{field.value || 'N/A'}</td>
            </tr>
          )) || <tr><td colSpan={2} className="text-center p-4">No custom fields</td></tr>}
        </tbody>
      </table>
    </div>
  );
}