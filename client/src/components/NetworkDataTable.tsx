'use client'

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from "framer-motion"

// Sample data structure based on your CSV format
interface NetworkData {
  id: string;
  dur: string;
  proto: string;
  service: string;
  state: string;
  spkts: string;
  dpkts: string;
  sbytes: string;
  dbytes: string;
  rate: string;
  sttl: string;
  dttl: string;
  sload: string;
  dload: string;
  sloss: string;
  dloss: string;
  sinpkt: string;
  dinpkt: string;
  sjit: string;
  djit: string;
  swin: string;
  stcpb: string;
  dtcpb: string;
  dwin: string;
  tcprtt: string;
  synack: string;
  ackdat: string;
  smean: string;
  dmean: string;
  trans_depth: string;
  response_body_len: string;
  ct_srv_src: string;
  ct_state_ttl: string;
  ct_dst_ltm: string;
  ct_src_dport_ltm: string;
  ct_dst_sport_ltm: string;
  ct_dst_src_ltm: string;
  is_ftp_login: string;
  ct_ftp_cmd: string;
  ct_flw_http_mthd: string;
  ct_src_ltm: string;
  ct_srv_dst: string;
  is_sm_ips_ports: string;
  attack_cat: string;
  label: string;
  [key: string]: string; // For other properties
}

const ITEMS_PER_PAGE = 10;
const MAX_PAGES = 10; // Limit to 10 pages only

// Sample data array based on your provided example
const sampleData: NetworkData[] = Array(ITEMS_PER_PAGE * MAX_PAGES).fill(null).map((_, index) => ({
  id: (index + 1).toString(),
  dur: "0.121478",
  proto: ["tcp", "udp", "icmp"][Math.floor(Math.random() * 3)],
  service: "-",
  state: ["FIN", "CON", "RST", "INT"][Math.floor(Math.random() * 4)],
  spkts: (Math.floor(Math.random() * 20) + 1).toString(),
  dpkts: (Math.floor(Math.random() * 15) + 1).toString(),
  sbytes: (Math.floor(Math.random() * 1000) + 100).toString(),
  dbytes: (Math.floor(Math.random() * 800) + 50).toString(),
  rate: (Math.random() * 100).toFixed(5),
  sttl: (Math.floor(Math.random() * 10) + 250).toString(),
  dttl: (Math.floor(Math.random() * 10) + 250).toString(),
  sload: (Math.random() * 20000).toFixed(5),
  dload: (Math.random() * 15000).toFixed(5),
  sloss: "0",
  dloss: "0",
  sinpkt: (Math.random() * 50).toFixed(4),
  dinpkt: (Math.random() * 40).toFixed(4),
  sjit: (Math.random() * 50).toFixed(6),
  djit: (Math.random() * 40).toFixed(6),
  swin: (Math.floor(Math.random() * 300) + 200).toString(),
  stcpb: (Math.floor(Math.random() * 999999999) + 500000000).toString(),
  dtcpb: (Math.floor(Math.random() * 999999999) + 500000000).toString(),
  dwin: (Math.floor(Math.random() * 300) + 200).toString(),
  tcprtt: "0",
  synack: "0",
  ackdat: "0",
  smean: (Math.floor(Math.random() * 100) + 1).toString(),
  dmean: (Math.floor(Math.random() * 100) + 1).toString(),
  trans_depth: "0",
  response_body_len: "0",
  ct_srv_src: "1",
  ct_state_ttl: "0",
  ct_dst_ltm: "1",
  ct_src_dport_ltm: "1",
  ct_dst_sport_ltm: "1",
  ct_dst_src_ltm: "1",
  is_ftp_login: "0",
  ct_ftp_cmd: "0",
  ct_flw_http_mthd: "0",
  ct_src_ltm: "1",
  ct_srv_dst: "1",
  is_sm_ips_ports: "0",
  attack_cat: index % 8 === 0 ? ["DoS", "Exploits", "Reconnaissance", "Shellcode", "Backdoor"][Math.floor(Math.random() * 5)] : "Normal",
  label: index % 8 === 0 ? "1" : "0"
}));

export default function NetworkDataAnalysis() {
  const [allData, setAllData] = useState<NetworkData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailsId, setShowDetailsId] = useState<string | null>(null);

  
  
  // Columns to display in the table
  const primaryColumns = ['id', 'proto', 'state', 'rate', 'spkts', 'dpkts', 'attack_cat', 'label'];
  
  // Additional columns to show in details view
  const detailColumns = ['dur', 'sbytes', 'dbytes', 'sttl', 'dttl', 'sload', 'dload', 'sinpkt', 'dinpkt'];

  useEffect(() => {
    // Simulate loading data
    const loadData = () => {
      setIsLoading(true);
      
      setTimeout(() => {
        
        setAllData(sampleData);
        setTotalPages(Math.min(Math.ceil(sampleData.length / ITEMS_PER_PAGE), MAX_PAGES));
        setIsLoading(false);
      }, 1000);
    };

    loadData();
  }, []);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return allData.slice(startIndex, endIndex);
  };

  // Update total pages when filtered data changes
  useEffect(() => {
    setTotalPages(Math.min(Math.ceil(allData.length / ITEMS_PER_PAGE), MAX_PAGES));
   
    if (currentPage > Math.ceil(allData.length / ITEMS_PER_PAGE)) {
      setCurrentPage(1);
    }
  }, [allData, currentPage]);

  // Toggle details row
  const toggleDetails = (id: string) => {
    if (showDetailsId === id) {
      setShowDetailsId(null);
    } else {
      setShowDetailsId(id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 min-h-screen bg-black text-gray-100 w-full"
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500" />
        </div>
      ) : (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-7xl mx-auto px-4"
        >
          <Card className="w-full bg-gray-900 border border-blue-500 shadow-lg shadow-blue-500/50">
            <CardHeader>
              <CardTitle className="text-blue-300 text-2xl">Network Traffic Logs</CardTitle>
              <div className="text-blue-300 mt-2">
                <span>Showing 10 pages of data ({ITEMS_PER_PAGE * MAX_PAGES} records)</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-900 border-b border-blue-500">
                      {primaryColumns.map((column) => (
                        <TableHead key={column} className="text-blue-300 text-lg whitespace-nowrap">
                          {column.charAt(0).toUpperCase() + column.slice(1)}
                        </TableHead>
                      ))}
                      <TableHead className="text-blue-300 text-lg">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {getCurrentPageData().map((item, index) => (
                        <>
                          <motion.tr
                            key={`row-${item.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="border-b border-blue-500/30 hover:bg-blue-500/10 transition-colors duration-200"
                          >
                            {primaryColumns.map((column) => (
                              <TableCell key={column} className="py-4">
                                {column === 'attack_cat' ? (
                                  <Badge 
                                    variant={item[column] === 'Normal' ? 'outline' : 'destructive'}
                                    className={item[column] === 'Normal' 
                                      ? 'border-blue-400 text-blue-400' 
                                      : 'bg-red-500 hover:bg-red-600 text-white'}
                                  >
                                    {item[column]}
                                  </Badge>
                                ) : (
                                  <span className={
                                    column === 'id' 
                                      ? 'font-medium text-purple-300 text-lg' 
                                      : column === 'label' 
                                        ? item[column] === '0' ? 'text-green-300 text-lg' : 'text-red-300 text-lg'
                                        : 'text-blue-100 text-lg'
                                  }>
                                    {item[column]}
                                  </span>
                                )}
                              </TableCell>
                            ))}
                            <TableCell>
                              <Badge 
                                variant="secondary" 
                                className="cursor-pointer bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500"
                                onClick={() => toggleDetails(item.id)}
                              >
                                {showDetailsId === item.id ? 'Hide' : 'View All'}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                          
                          {/* Details row that appears when View All is clicked */}
                          {showDetailsId === item.id && (
                            <motion.tr
                              key={`details-${item.id}`}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-blue-900/20"
                            >
                              <TableCell colSpan={primaryColumns.length + 1} className="py-4">
                                <div className="grid grid-cols-3 gap-4 p-4 rounded-lg bg-gray-800 border border-blue-500/50">
                                  {Object.keys(item).filter(key => !primaryColumns.includes(key)).map(key => (
                                    <div key={key} className="flex flex-col">
                                      <span className="text-blue-300 text-sm">{key}:</span>
                                      <span className="text-white font-medium">{item[key]}</span>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </motion.tr>
                          )}
                        </>
                      ))}
                    </AnimatePresence>
                    {getCurrentPageData().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={primaryColumns.length + 1} className="text-center py-8 text-blue-100">
                          No results found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <motion.div
                className="flex justify-between mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="bg-blue-500 text-white hover:bg-blue-600 border-blue-300 shadow-md shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  Previous
                </Button>
                <span className="text-blue-300 text-lg sm:text-xl md:text-2xl font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="bg-blue-500 text-white hover:bg-blue-600 border-blue-300 shadow-md shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                >
                  Next
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
