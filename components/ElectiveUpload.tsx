'use client';

import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface ElectiveUploadProps {
  onDataLoaded: (data: any[]) => void;
  companyName?: string;
}

export const ElectiveUpload: React.FC<ElectiveUploadProps> = ({ onDataLoaded, companyName }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setFileName(file.name);
    setError(null);
    setIsParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsParsing(false);
        if (results.errors.length > 0) {
          console.error('CSV Parsing Errors:', results.errors);
          setError('Error parsing CSV file. Please check the format.');
          return;
        }

        // Map the CSV data to the expected format
        // Sale Date, Adjustment Date, Order ID, Customer Id, Customer, Email, State, Country, City, Street, Postal Code, Checkout Name, Type, Term, Currency, Order Total, Fees Total, Net Amount, Amount Collected, Tax Amount, Status
        const mappedData = results.data.map((row: any) => ({
          saleDate: row['Sale Date'],
          customerEmail: row['Email']?.toLowerCase().trim(),
          customerName: row['Customer'],
          checkoutName: row['Checkout Name'],
          type: row['Type'],
          term: row['Term'],
          feesTotal: parseFloat(row['Fees Total']?.replace(/[^0-9.-]+/g, '')) || 0,
          netAmount: parseFloat(row['Net Amount']?.replace(/[^0-9.-]+/g, '')) || 0,
          status: row['Status'],
          orderTotal: parseFloat(row['Order Total']?.replace(/[^0-9.-]+/g, '')) || 0,
          companyName: companyName // Tag data with company name
        })).filter(item => item.customerEmail);

        onDataLoaded(mappedData);
      },
      error: (err) => {
        setIsParsing(false);
        setError(`Error: ${err.message}`);
      }
    });
  };

  const clearFile = () => {
    setFileName(null);
    setError(null);
    onDataLoaded([]);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600" />
            Upload Elective CSV {companyName ? `for ${companyName}` : ''}
          </h3>
          <p className="text-xs text-gray-500 font-medium">Merge Elective sales data with existing records</p>
        </div>
        {fileName && (
          <button 
            onClick={clearFile}
            className="p-2 hover:bg-red-50 rounded-full text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!fileName ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileText className="w-8 h-8 text-gray-300 group-hover:text-blue-400 mb-2 transition-colors" />
            <p className="text-sm text-gray-500 font-bold">Click to upload or drag and drop</p>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">CSV Files Only</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={handleFileUpload} />
        </label>
      ) : (
        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{fileName}</p>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">
              {isParsing ? 'Parsing data...' : 'Data loaded successfully'}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      )}
    </div>
  );
};
