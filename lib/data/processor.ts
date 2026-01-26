export function createUnifiedTableData(rawData: any) {
  const {
    products,
    plans,
    memberships,
    users,
    payments,
    refunds,
    reviews,
    promoCodes,
    invoices,
    entries
  } = rawData;

  const productMap = new Map(products.map((p: any) => [p.id, p]));
  const planMap = new Map(plans.map((p: any) => [p.id, p]));
  const userMap = new Map(users.map((u: any) => [u.id, u]));
  const promoCodeMap = new Map(promoCodes.map((pc: any) => [pc.id, pc]));

  const paymentsByUser = groupBy(payments, 'user_id');
  const refundsByPayment = groupBy(refunds, 'payment_id');
  const reviewsByUser = groupBy(reviews, 'user_id');
  const invoicesByUser = groupBy(invoices, 'user_id');
  const entriesByUser = groupBy(entries, 'user_id');

  return memberships.map((membership: any) => {
    const user = userMap.get(membership.user_id) as any;
    const product = productMap.get(membership.product_id) as any;
    const plan = planMap.get(membership.plan_id) as any;
    
    const userPayments = paymentsByUser[membership.user_id] || [];
    const membershipPayments = userPayments.filter((p: any) => p.membership_id === membership.id);
    
    const totalPayments = membershipPayments.reduce((sum: number, p: any) => {
      return p.status === 'succeeded' ? sum + p.final_amount : sum;
    }, 0);

    const lastPayment = membershipPayments
      .filter((p: any) => p.status === 'succeeded')
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    const totalRefunded = membershipPayments.reduce((sum: number, payment: any) => {
      const paymentRefunds = refundsByPayment[payment.id] || [];
      return sum + paymentRefunds.reduce((s: number, r: any) => s + r.amount, 0);
    }, 0);

    const userReviews = reviewsByUser[membership.user_id] || [];
    const productReview = userReviews.find((r: any) => r.product_id === membership.product_id);

    const usedPromoCode = lastPayment?.promo_code_id 
      ? promoCodeMap.get(lastPayment.promo_code_id) as any
      : null;

    const userInvoices = invoicesByUser[membership.user_id] || [];
    const userEntries = entriesByUser[membership.user_id] || [];

    return {
      email: membership.email || user?.email,
      user_id: user?.id,
      username: user?.username,
      profile_pic: user?.profile_pic_url,
      user_created_at: user?.created_at,
      product_name: product?.title,
      product_id: product?.id,
      plan_name: plan?.title,
      plan_type: plan?.plan_type,
      plan_price: plan?.renewal_price || plan?.initial_price,
      plan_billing_period: plan?.billing_period,
      currency: plan?.currency,
      membership_id: membership.id,
      membership_status: membership.status,
      is_valid: membership.valid,
      membership_created_at: membership.created_at,
      membership_expires_at: membership.expires_at,
      renewal_period_start: membership.renewal_period_start,
      renewal_period_end: membership.renewal_period_end,
      cancellation_date: membership.cancellation_date,
      license_key: membership.license_key,
      total_payments: totalPayments / 100,
      payment_count: membershipPayments.length,
      last_payment_date: lastPayment?.created_at,
      last_payment_amount: lastPayment?.final_amount / 100,
      total_refunded: totalRefunded / 100,
      promo_code_used: usedPromoCode?.code,
      review_rating: productReview?.rating,
      review_content: productReview?.content,
      has_discord: !!membership.discord,
      invoice_count: userInvoices.length,
      entry_count: userEntries.length,
    };
  });
}

function groupBy(array: any[], key: string) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, any[]>);
}
