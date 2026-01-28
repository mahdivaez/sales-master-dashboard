import { WhopPayment } from '@/types';

interface PaymentTableProps {
  payments: WhopPayment[];
}

export function PaymentTable({ payments }: PaymentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {payment.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div>{payment.user.name}</div>
                <div className="text-xs text-gray-400">{payment.user.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {payment.product.title}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                <div className="font-bold text-gray-900 dark:text-white">
                  {((payment.amount_after_fees || payment.usd_total) - (payment.refunded_amount || 0)).toLocaleString('en-US', {
                    style: 'currency',
                    currency: payment.currency.toUpperCase(),
                  })}
                </div>
                <div className="text-[10px] text-gray-500">
                  <span className="line-through">{(payment.total - (payment.refunded_amount || 0)).toLocaleString('en-US', {
                    style: 'currency',
                    currency: payment.currency.toUpperCase(),
                  })}</span>
                  <span className="ml-1 text-[8px] uppercase tracking-tighter">Before Fee</span>
                </div>
                {payment.refunded_amount > 0 && (
                  <div className="text-xs text-red-500">
                    Refunded: {payment.refunded_amount.toLocaleString('en-US', {
                      style: 'currency',
                      currency: payment.currency.toUpperCase(),
                    })}
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  payment.substatus === 'succeeded' || payment.substatus === 'resolution_won'
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {payment.substatus}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {new Date(payment.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
