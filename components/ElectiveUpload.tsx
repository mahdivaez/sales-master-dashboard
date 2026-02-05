'use client';

import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

interface ElectiveUploadProps {
  onDataLoaded: (data: any[]) => void;
  companyName?: string;
  companyId: string;
}

export const ElectiveUpload: React.FC<ElectiveUploadProps> = ({ onDataLoaded, companyName, companyId }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setFileName(file.name);
    setError(null);
    setSuccess(false);
    setIsParsing(true);

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

        const mappedData = results.data.map((row: any) => ({
          saleDate: row['Sale Date'],
          customerEmail: row['Email']?.toLowerCase().trim(),
          customerName: row['Customer'],
          netAmount: parseFloat(row['Net Amount']?.replace(/[^0-9.-]+/g, '')) || 0,
        })).filter(item => item.customerEmail);

        // Save to Database
        setIsSaving(true);
        try {
          const response = await fetch('/api/elective/save', {
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
    setSuccess(false);
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
          <p className="text-xs text-gray-500 font-medium">Save Elective sales data to database</p>
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
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${success ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${success ? 'bg-green-600' : 'bg-blue-600'}`}>
            {isSaving || isParsing ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900">{fileName}</p>
            <p className={`text-[10px] font-black uppercase tracking-wider ${success ? 'text-green-600' : 'text-blue-600'}`}>
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
