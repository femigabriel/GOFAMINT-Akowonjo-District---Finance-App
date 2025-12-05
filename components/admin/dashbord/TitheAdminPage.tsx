// components/TitheAdminPage.tsx
import React, { useState, useMemo, useEffect, useRef } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import Handsontable from "handsontable";
import {
  Search,
  Users,
  Filter,
  Calendar,
  Download,
  Upload,
  Save,
  Plus,
  Trash2,
  Printer,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { titheData } from "@/lib/tithe-data";

// Types
interface Member {
  sn: number;
  name: string;
}

interface AssemblyData {
  assembly: string;
  members: Member[];
}

interface TitheRecord {
  sn: number;
  name: string;
  week1: number | string;
  week2: number | string;
  week3: number | string;
  week4: number | string;
  week5: number | string;
  total?: number;
  status?: string;
}

const TitheAdminPage: React.FC = () => {
  // State
  const [selectedAssembly, setSelectedAssembly] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [monthStartDate, setMonthStartDate] = useState<Date | null>(new Date());
  const [monthEndDate, setMonthEndDate] = useState<Date | null>(new Date());
  const [showEmptyOnly, setShowEmptyOnly] = useState(false);
  const [showPaidOnly, setShowPaidOnly] = useState(false);
  const [titheRecords, setTitheRecords] = useState<TitheRecord[]>([]);
  const hotTableRef = useRef<HotTableClass>(null);

  // Initialize with first assembly if not selected
  useEffect(() => {
    if (!selectedAssembly && titheData.length > 0) {
      setSelectedAssembly(titheData[0].assembly);
    }
  }, []);

  // Get selected assembly data
  const selectedAssemblyData = useMemo(() => {
    return titheData.find((assembly) => assembly.assembly === selectedAssembly);
  }, [selectedAssembly]);

  // Initialize tithe records when assembly changes
  useEffect(() => {
    if (selectedAssemblyData) {
      const initialRecords: TitheRecord[] = selectedAssemblyData.members.map(
        (member) => ({
          sn: member.sn,
          name: member.name,
          week1: "",
          week2: "",
          week3: "",
          week4: "",
          week5: "",
          total: 0,
          status: "pending",
        })
      );
      setTitheRecords(initialRecords);
    }
  }, [selectedAssemblyData]);

  // Get all unique assembly names for dropdown
  const assemblyOptions = useMemo(() => {
    return titheData.map((item) => ({
      value: item.assembly,
      label: item.assembly,
      count: item.members.length,
    }));
  }, []);

  // Filter records based on search and filters
  const filteredRecords = useMemo(() => {
    if (!titheRecords.length) return [];

    return titheRecords.filter((record) => {
      // Search filter
      if (
        searchTerm &&
        !record.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Empty records filter
      if (showEmptyOnly) {
        const isEmpty =
          !record.week1 &&
          !record.week2 &&
          !record.week3 &&
          !record.week4 &&
          !record.week5;
        if (!isEmpty) return false;
      }

      // Paid records filter
      if (showPaidOnly) {
        const total = calculateTotal(record);
        const isPaid = total > 0;
        if (!isPaid) return false;
      }

      return true;
    });
  }, [titheRecords, searchTerm, showEmptyOnly, showPaidOnly]);

  // Calculate total for a record
  const calculateTotal = (record: TitheRecord): number => {
    const week1 = Number(record.week1) || 0;
    const week2 = Number(record.week2) || 0;
    const week3 = Number(record.week3) || 0;
    const week4 = Number(record.week4) || 0;
    const week5 = Number(record.week5) || 0;
    return week1 + week2 + week3 + week4 + week5;
  };

  // Update totals when records change
  useEffect(() => {
    const updatedRecords = titheRecords.map((record) => ({
      ...record,
      total: calculateTotal(record),
      status: calculateTotal(record) > 0 ? "paid" : "pending",
    }));
    setTitheRecords(updatedRecords);
  }, [
    titheRecords
      .map((r) => `${r.week1}|${r.week2}|${r.week3}|${r.week4}|${r.week5}`)
      .join(";"),
  ]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totals = titheRecords.map(calculateTotal);
    const paidRecords = totals.filter((total) => total > 0).length;
    const totalAmount = totals.reduce((sum, total) => sum + total, 0);
    const averageAmount =
      titheRecords.length > 0 ? totalAmount / paidRecords : 0;

    return {
      totalMembers: titheRecords.length,
      paidMembers: paidRecords,
      pendingMembers: titheRecords.length - paidRecords,
      totalAmount,
      averageAmount: Math.round(averageAmount),
    };
  }, [titheRecords]);

  // HotTable configuration
  const hotData = useMemo(() => {
    return filteredRecords.map((record) => [
      record.sn,
      record.name,
      record.week1,
      record.week2,
      record.week3,
      record.week4,
      record.week5,
      record.total,
      record.status,
    ]);
  }, [filteredRecords]);

  const hotColumns = [
    {
      title: "SN",
      data: 0,
      type: "numeric",
      width: 80,
      readOnly: true,
      className: "htCenter",
    },
    {
      title: "Name",
      data: 1,
      type: "text",
      width: 250,
      readOnly: true,
    },
    {
      title: "Week 1",
      data: 2,
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "0,0",
        culture: "en-US",
      },
    },
    {
      title: "Week 2",
      data: 3,
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "0,0",
        culture: "en-US",
      },
    },
    {
      title: "Week 3",
      data: 4,
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "0,0",
        culture: "en-US",
      },
    },
    {
      title: "Week 4",
      data: 5,
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "0,0",
        culture: "en-US",
      },
    },
    {
      title: "Week 5",
      data: 6,
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "0,0",
        culture: "en-US",
      },
    },
    {
      title: "Total",
      data: 7,
      type: "numeric",
      width: 120,
      readOnly: true,
      numericFormat: {
        pattern: "0,0",
        culture: "en-US",
      },
      renderer: function (
        instance: any,
        td: HTMLElement,
        row: number,
        col: number,
        prop: any,
        value: any
      ) {
        Handsontable.renderers.NumericRenderer.apply(this, arguments as any);
        if (value > 0) {
          td.style.backgroundColor = "#d1fae5";
          td.style.fontWeight = "bold";
        } else {
          td.style.backgroundColor = "#fef3c7";
        }
      },
    },
    {
      title: "Status",
      data: 8,
      width: 100,
      readOnly: true,
      renderer: function (
        instance: any,
        td: HTMLElement,
        row: number,
        col: number,
        prop: any,
        value: any
      ) {
        if (value === "paid") {
          td.innerHTML =
            '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">Paid</span>';
        } else {
          td.innerHTML =
            '<span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">Pending</span>';
        }
      },
    },
  ];

  // Event handlers
  const handleSaveData = () => {
    const hot = hotTableRef.current?.hotInstance;
    if (hot) {
      const data = hot.getData();
      console.log("Saving data:", data);
      alert("Data saved successfully!");
    }
  };

const handleExportCSV = () => {
  const hot = hotTableRef.current?.hotInstance;
  if (hot) {
    const exportPlugin = hot.getPlugin("exportFile");
    exportPlugin.downloadFile("csv", {
      bom: true,
      filename: `${selectedAssembly}_tithe_${new Date().toISOString().split("T")[0]}`,
    });
  }
};


  const handlePrint = () => {
    window.print();
  };


const handleCellChange = (
  changes: Handsontable.CellChange[] | null,
  source: Handsontable.ChangeSource
) => {
  if (!changes || source !== "edit") return;

  const updatedRecords = [...titheRecords];

  changes.forEach(([row, prop, oldValue, newValue]) => {
    const fieldMap = {
      2: "week1",
      3: "week2",
      4: "week3",
      5: "week4",
      6: "week5",
    } as const;

    const key = Number(prop) as keyof typeof fieldMap;

    if (key in fieldMap) {
      const field = fieldMap[key];
      updatedRecords[row][field] = (newValue ?? "") as TitheRecord[typeof field];
    }
  });

  setTitheRecords(updatedRecords);
};



  const handlePrevMonth = () => {
    const date = new Date(monthStartDate || new Date());
    date.setMonth(date.getMonth() - 1);
    setMonthStartDate(date);
    setMonthEndDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  };

  const handleNextMonth = () => {
    const date = new Date(monthStartDate || new Date());
    date.setMonth(date.getMonth() + 1);
    setMonthStartDate(date);
    setMonthEndDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 print:p-2">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Tithe Management System
              </h1>
              <p className="text-gray-600 mt-1">
                Admin dashboard for tracking weekly tithe contributions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Main Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 print:hidden">
          {/* Assembly Selector */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Select Assembly
            </h3>
            <div className="space-y-4">
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
                value={selectedAssembly}
                onChange={(e) => setSelectedAssembly(e.target.value)}
              >
                {assemblyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} ({option.count} members)
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{selectedAssemblyData?.members.length || 0} members</span>
              </div>
            </div>
          </div>

          {/* Month Selector */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Month Period
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex-1 text-center">
                  <p className="font-medium">
                    {monthStartDate?.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-gray-500">Weeks 1-5</p>
                </div>

                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  selected={monthStartDate}
                  onChange={(date) => setMonthStartDate(date)}
                  dateFormat="MMM dd, yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholderText="Start date"
                />
                <DatePicker
                  selected={monthEndDate}
                  onChange={(date) => setMonthEndDate(date)}
                  dateFormat="MMM dd, yyyy"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholderText="End date"
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Filters
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search members..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowEmptyOnly(!showEmptyOnly)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    showEmptyOnly
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <EyeOff className="w-4 h-4" />
                  Empty Only
                </button>
                <button
                  onClick={() => setShowPaidOnly(!showPaidOnly)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                    showPaidOnly
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Paid Only
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 print:hidden">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Members</p>
            <p className="text-2xl font-bold text-gray-800">
              {summaryStats.totalMembers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Paid Members</p>
            <p className="text-2xl font-bold text-green-600">
              {summaryStats.paidMembers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">
              {summaryStats.pendingMembers}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Amount</p>
            <p className="text-2xl font-bold text-blue-600">
              ₦{summaryStats.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* HotTable Spreadsheet */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between print:hidden">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {selectedAssembly} Assembly
              </h2>
              <p className="text-gray-600">
                Weekly Tithe Records -{" "}
                {monthStartDate?.toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={handleSaveData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>

          <div className="p-2 md:p-4">
            <HotTable
              ref={hotTableRef}
              data={hotData}
              columns={hotColumns}
              colHeaders={true}
              rowHeaders={false}
              width="100%"
              height="auto"
              maxRows={filteredRecords.length}
              manualRowMove={true}
              manualColumnMove={true}
              manualColumnResize={true}
              contextMenu={true}
              filters={true}
              dropdownMenu={true}
              columnSorting={true}
              stretchH="all"
              licenseKey="non-commercial-and-evaluation"
              afterChange={handleCellChange}
              className="custom-hot-table"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="print:hidden">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {filteredRecords.length} of {titheRecords.length}{" "}
                members
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Data
                </button>
                <button className="px-4 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
                <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-gray-500 text-sm">
            <p>
              Tithe Management System • {new Date().getFullYear()} • Last
              Updated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>
        {`
          @media print {
            .print\\:hidden {
              display: none !important;
            }
            
            .custom-hot-table {
              height: auto !important;
              max-height: none !important;
            }
            
            .ht_clone_top_left_corner,
            .ht_clone_top {
              display: none !important;
            }
            
            body {
              background: white !important;
            }
          }
          
          .custom-hot-table .htCore td {
            white-space: normal !important;
            word-wrap: break-word;
          }
          
          .custom-hot-table .handsontable td {
            border-right: 1px solid #e5e7eb;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .custom-hot-table .handsontable th {
            background-color: #f9fafb;
            font-weight: 600;
            color: #374151;
            border-right: 1px solid #e5e7eb;
            border-bottom: 2px solid #e5e7eb;
          }
        `}
      </style>
    </div>
  );
};

export default TitheAdminPage;
