import { NextResponse } from 'next/server';
import { getUnifiedUserData } from '@/app/actions';

export async function GET() {
  try {
    console.log('Starting test of unified data fetching...');
    
    // Fetch unified data
    const result = await getUnifiedUserData();
    
    if (result.success && result.data) {
      const data = result.data;
      
      // Analyze the data
      const totalUsers = data.length;
      const usersWithWhopData = data.filter(user =>
        user.whopData?.member ||
        (user.whopData?.payments && user.whopData.payments.length > 0) ||
        (user.whopData?.memberships && user.whopData.memberships.length > 0)
      ).length;
      const usersWithSheetData = data.filter(user => user.sheetData && user.sheetData.length > 0).length;
      const usersWithEnhancedData = 0; // Property removed from data structure
      
      // Calculate overlap
      const usersInBothSources = data.filter(user =>
        (user.whopData?.member ||
         (user.whopData?.payments && user.whopData.payments.length > 0) ||
         (user.whopData?.memberships && user.whopData.memberships.length > 0)) &&
        (user.sheetData && user.sheetData.length > 0)
      ).length;
      
      // Return statistics
      return NextResponse.json({
        success: true,
        stats: {
          totalUsers,
          usersWithWhopData,
          usersWithSheetData,
          usersWithEnhancedData,
          usersInBothSources,
          percentageWithEnhancedData: '0%',
          percentageInBothSources: totalUsers > 0 ? (usersInBothSources / totalUsers * 100).toFixed(2) + '%' : '0%'
        },
        // Include a sample of users for inspection
        sampleUsers: data.slice(0, 5).map(user => ({
          email: user.email,
          name: user.name,
          whopId: user.whopId,
          hasWhopData: !!user.whopData?.member ||
                      (user.whopData?.payments && user.whopData.payments.length > 0) ||
                      (user.whopData?.memberships && user.whopData.memberships.length > 0),
          hasSheetData: user.sheetData && user.sheetData.length > 0,
          hasEnhancedData: false,
          totalSpentWhop: user.totalSpentWhop || 0,
          totalSpentSheet: user.totalSpentSheet || 0
        }))
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        errorDetails: 'No additional error details available'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in test-whop API route:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
