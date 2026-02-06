'use client';

import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface FanbasisUploadProps {
  onDataLoaded: (data: any[]) => void;
  companyName?: string;
  companyId: string;
}

export const FanbasisUpload: React.FC<FanbasisUploadProps> = ({ onDataLoaded, companyName, companyId }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveData = async (data: any[], fileName: string) => {
    const mappedData = data.map((row: any) => ({
      amount: parseFloat(row['Amount']?.toString().replace(/[^0-9.-]+/g, '')) || 0,
      status: row['Status'] || '',
      date: row['Date'] || '',
      customerName: row['Customer Name'] || '',
      customerEmail: row['Customer Email']?.toString().toLowerCase().trim() || '',
      product: row['Product'] || '',
      productId: row['Product ID'] || '',
      discountCode: row['Discount Code'] || '',
      discountedAmount: parseFloat(row['Discounted Amount']?.toString().replace(/[^0-9.-]+/g, '')) || 0,
      saleId: row['Sale ID'] || '',
      netAmount: parseFloat(row['Net Amount (Earnings)']?.toString().replace(/[^0-9.-]+/g, '')) || 0,
      paymentMethod: row['Payment Method'] || '',
      availableToWithdraw: row['Available to Withdraw'] || '',
    })).filter(item => item.customerEmail);

    if (mappedData.length === 0) {
      setError('No valid data found. Please check that the file has a "Customer Email" column.');
      setIsSaving(false);
      return;
    }

    // Save to Database
    setIsSaving(true);
    try {
      const response = await fetch('/api/fanbasis/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: mappedData, companyId })
      });

      if (response.ok) {
        setSuccess(true);
        onDataLoaded(mappedData);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to save data to database.');
      }
    } catch (err) {
      setError('An error occurred while saving to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const currentFileName = file.name;
    const isCsv = currentFileName.endsWith('.csv');
    const isXlsx = currentFileName.endsWith('.xlsx') || currentFileName.endsWith('.xls');

    if (!isCsv && !isXlsx) {
      setError('Please upload a valid CSV or XLSX file.');
      return;
    }

    setFileName(currentFileName);
    setError(null);
    setSuccess(false);
    setIsParsing(true);

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          setIsParsing(false);
          if (results.errors.length > 0) {
            console.error('CSV Parsing Errors:', results.errors);
            setError('Error parsing CSV file. Please check the format.');
            return;
          }
          await saveData(results.data, currentFileName);
        },
        error: (err) => {
          setIsParsing(false);
          setError(`Error: ${err.message}`);
        }
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          setIsParsing(false);
          saveData(jsonData, currentFileName);
        } catch (err) {
          setIsParsing(false);
          setError('Error parsing XLSX file. Please check the format.');
        }
      };
      reader.onerror = () => {
        setIsParsing(false);
        setError('Error reading file.');
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const clearFile = () => {
    setFileName(null);
    setError(null);
    setSuccess(false);
    onDataLoaded([]);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-600" />
            Upload Fanbasis {companyName ? `for ${companyName}` : ''}
          </h3>
          <p className="text-xs text-gray-500 font-medium">Save Fanbasis sales data to database</p>
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
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-purple-300 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileText className="w-8 h-8 text-gray-300 group-hover:text-purple-400 mb-2 transition-colors" />
            <p className="text-sm text-gray-500 font-bold">Click to upload or drag and drop</p>
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">CSV or XLSX Files</p>
          </div>
          <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
        </label>
      ) : (
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${success ? 'bg-green-50 border-green-100' : 'bg-purple-50 border-purple-100'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${success ? 'bg-green-600' : 'bg-purple-600'}`}>
            {isSaving || isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{fileName}</p>
            <p className={`text-[10px] font-black uppercase tracking-wider ${success ? 'text-green-600' : 'text-purple-600'}`}>
              {isParsing ? 'Parsing data...' : isSaving ? 'Saving to database...' : 'Data saved successfully'}
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
