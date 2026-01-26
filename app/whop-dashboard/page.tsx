import { fetchAllWhopData } from '@/lib/whop/fetchers';
import { createUnifiedTableData } from '@/lib/data/processor';

export default async function WhopDashboardPage() {
  let rawData = [];
  let error: string | null = null;

  try {
    rawData = await fetchAllWhopData();
  } catch (e: any) {
    console.error('Failed to fetch Whop data:', e);
    error = e.message;
  }

  const tableData = createUnifiedTableData(rawData);

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error fetching data: </strong>
          <span className="block sm:inline">{error}. Please check your connection to api.whop.com.</span>
        </div>
      </div>
    );
  }

  // Simple KPI calculations for the demo
  const totalRevenue = tableData.reduce((sum: number, row: any) => sum + (row.total_payments || 0), 0);
  const activeMemberships = tableData.filter((row: any) => row.is_valid).length;
  const totalUsers = new Set(tableData.map((row: any) => row.email)).size;

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Whop Sales Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Active Memberships</p>
          <p className="text-2xl font-bold">{activeMemberships}</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold">{totalUsers}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Unified Customer Data</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Paid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.product_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.plan_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.is_valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {row.membership_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${row.total_payments.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(row.membership_created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
