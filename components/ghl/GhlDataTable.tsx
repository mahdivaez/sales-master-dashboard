interface GhlDataTableProps {
  data: any[];
  columns: { key: string; label: string }[];
}

export function GhlDataTable({ data, columns }: GhlDataTableProps) {
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
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map(col => (
                <td key={col.key} className="border border-gray-300 px-4 py-3 text-gray-900">
                  {row[col.key] || 'N/A'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}