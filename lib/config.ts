export interface CompanyConfig {
  id: string;
  name: string;
  whopCompanyId: string;
  whopApiKey: string;
  ghlLocationId: string;
  ghlAccessToken: string;
  googleSheetCashCollectedUrl: string;
  googleSheetPipelineUrl: string;
}

export const COMPANIES: CompanyConfig[] = [
  {
    id: 'hceo',
    name: 'HCEO',
    whopCompanyId: process.env.HCEO_WHOP_COMPANY_ID || '',
    whopApiKey: process.env.HCEO_WHOP_API_KEY || '',
    ghlLocationId: process.env.HCEO_GHL_LOCATION_ID || '',
    ghlAccessToken: process.env.HCEO_GHL_ACCESS_TOKEN || '',
    googleSheetCashCollectedUrl: process.env.HCEO_GOOGLE_SHEET_CASH_COLLECTED_URL || '',
    googleSheetPipelineUrl: process.env.HCEO_GOOGLE_SHEET_PIPELINE_URL || '',
  },
  {
    id: 'kceo',
    name: 'KCEO',
    whopCompanyId: process.env.KCEO_WHOP_COMPANY_ID || '',
    whopApiKey: process.env.KCEO_WHOP_API_KEY || '',
    ghlLocationId: process.env.KCEO_GHL_LOCATION_ID || '',
    ghlAccessToken: process.env.KCEO_GHL_ACCESS_TOKEN || '',
    googleSheetCashCollectedUrl: process.env.KCEO_GOOGLE_SHEET_CASH_COLLECTED_URL || '',
    googleSheetPipelineUrl: process.env.KCEO_GOOGLE_SHEET_PIPELINE_URL || '',
  }
];
