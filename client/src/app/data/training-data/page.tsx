"use client";
import React from 'react';
import NetworkDataTable from '@/components/NetworkDataTable';
import { Button } from "@/components/ui/button";
import { Download } from 'lucide-react';

const NetworkDataPage = () => {
  const handleDownload = () => {
    // Create a link to download the CSV file from the public folder
    const link = document.createElement('a');
    link.href = '/UNSW_NB15_training-set.csv';
    link.download = 'UNSW_NB15_training-set.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-start justify-center bg-black px-4 py-10 sm:p-8 md:p-12 lg:p-24 mt-5">
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-2xl lg:text-3xl xl:text-5xl font-bold text-white font-akira">
          Data we used for Training our model
        </h1>
        
        <Button 
          onClick={handleDownload}
          className="mt-4 md:mt-0 bg-blue-500 text-white hover:bg-blue-600 border border-blue-300 shadow-md shadow-blue-500/50 transition-all duration-300 text-lg flex items-center gap-2"
        >
          <Download className="h-5 w-5" />
          Download Dataset
        </Button>
      </div>
      
      <NetworkDataTable />
    </main>
  );
};

export default NetworkDataPage;