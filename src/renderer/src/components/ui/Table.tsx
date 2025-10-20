import React from 'react'

export default function Table({ columns, data }: { columns: string[]; data: any[] }) {
  return (
    <div className="overflow-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {row[col.toLowerCase()] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
