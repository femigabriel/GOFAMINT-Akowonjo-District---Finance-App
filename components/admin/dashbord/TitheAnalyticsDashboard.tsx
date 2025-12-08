// components/TitheSpreadsheet.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Select, Button, Dropdown, Space, notification } from "antd";
import {
  BankOutlined,
  SearchOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  DownOutlined,
} from "@ant-design/icons";
import Handsontable from "handsontable";
import type { CellChange, ChangeSource } from "handsontable/common";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

const { Option } = Select;

// Register all Handsontable modules
registerAllModules();

interface TitheMember {
  sn: number;
  name: string;
  titheNumber?: string;
  week1?: number;
  week2?: number;
  week3?: number;
  week4?: number;
  week5?: number;
  total?: number;
  assembly: string;
  month: string;
}

interface AssemblyData {
  assembly: string;
  members: TitheMember[];
}

interface TitheSpreadsheetProps {
  data?: AssemblyData[];
}

const TitheSpreadsheet: React.FC<TitheSpreadsheetProps> = ({
  data: externalData,
}) => {
  const [assembly, setAssembly] = useState<string>("");
  const [allData, setAllData] = useState<AssemblyData[]>([]);
  const [filteredData, setFilteredData] = useState<TitheMember[]>([]);
  const [loading, setLoading] = useState(!externalData);
  const hotTableRef = useRef<HotTableClass>(null);

  useEffect(() => {
    if (externalData) {
      setAllData(externalData);
      if (externalData.length > 0) {
        setAssembly(externalData[0].assembly);
      }
      setLoading(false);
    } else {
      fetchData();
    }
  }, [externalData]);

  useEffect(() => {
    if (assembly && allData.length > 0) {
      const selected = allData.find((a) => a.assembly === assembly);
      setFilteredData(selected?.members || []);
    }
  }, [assembly, allData]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/tithes/summary");
      const result = await response.json();

      if (result.success) {
        const transformedData = transformApiData(result.data);
        setAllData(transformedData);
        if (transformedData.length > 0) {
          setAssembly(transformedData[0].assembly);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData: any): AssemblyData[] => {
    const assemblies: AssemblyData[] = [];

    apiData.summary.byAssembly.forEach((assembly: any) => {
      const members: TitheMember[] = [];

      assembly.paidMembers.forEach((member: any) => {
        members.push({
          sn: member.sn,
          name: member.name,
          titheNumber: member.titheNumber,
          week1: member.weeks?.week1 ? member.totalPaid : 0,
          week2: member.weeks?.week2 ? member.totalPaid : 0,
          week3: member.weeks?.week3 ? member.totalPaid : 0,
          week4: member.weeks?.week4 ? member.totalPaid : 0,
          week5: member.weeks?.week5 ? member.totalPaid : 0,
          total: member.totalPaid,
          assembly: assembly.assembly,
          month: assembly.stats.submissionMonths[0] || "",
        });
      });

      assembly.missingMemberList.forEach((member: any) => {
        members.push({
          sn: member.sn,
          name: member.name,
          week1: 0,
          week2: 0,
          week3: 0,
          week4: 0,
          week5: 0,
          total: 0,
          assembly: assembly.assembly,
          month: "",
        });
      });

      members.sort((a, b) => a.sn - b.sn);

      assemblies.push({
        assembly: assembly.assembly,
        members,
      });
    });

    return assemblies;
  };

  const calculateTotals = () => {
    const totals = {
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
      week5: 0,
      total: 0,
    };

    filteredData.forEach((member) => {
      totals.week1 += member.week1 || 0;
      totals.week2 += member.week2 || 0;
      totals.week3 += member.week3 || 0;
      totals.week4 += member.week4 || 0;
      totals.week5 += member.week5 || 0;
      totals.total += member.total || 0;
    });

    return totals;
  };

  const totals = calculateTotals();

  // Function to export as Excel (CSV)
  const exportToExcel = () => {
    try {
      if (filteredData.length === 0) {
        notification.warning({
          message: "No Data to Export",
          description: "There are no records to export",
        });
        return;
      }

      // Create headers
      const headers = [
        "S/N",
        "Name",
        "Tithe Number",
        "Week 1",
        "Week 2",
        "Week 3",
        "Week 4",
        "Week 5",
        "Total",
      ];

      // Create data rows
      const rows = filteredData.map((member) => [
        member.sn,
        `"${member.name}"`,
        member.titheNumber || "",
        member.week1 || 0,
        member.week2 || 0,
        member.week3 || 0,
        member.week4 || 0,
        member.week5 || 0,
        member.total || 0,
      ]);

      // Add total row
      const totalRow = [
        "",
        "TOTAL",
        "",
        totals.week1,
        totals.week2,
        totals.week3,
        totals.week4,
        totals.week5,
        totals.total,
      ];

      // Combine all content
      const csvContent = [
        `GOFAMINT TITHE COLLECTION REPORT - ${assembly}`,
        `Generated: ${moment().format("DD/MM/YYYY HH:mm")}`,
        "",
        headers.join(","),
        ...rows.map((row) => row.join(",")),
        totalRow.join(","),
        "",
        `Total Members: ${filteredData.length}`,
        `Total Collection: ₦${totals.total.toLocaleString()}`,
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Tithe_Collection_${assembly}_${moment().format("DD_MM_YYYY")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notification.success({
        message: "Export Successful",
        description: "Excel (CSV) file downloaded successfully",
      });
    } catch (error) {
      console.error("Export error:", error);
      notification.error({
        message: "Export Failed",
        description: "Failed to export Excel file",
      });
    }
  };

  // Function to export as PDF
// Function to export as PDF with improved design
const exportToPDF = () => {
  try {
    if (filteredData.length === 0) {
      notification.warning({
        message: "No Data to Export",
        description: "There are no records to export",
      });
      return;
    }

    // Create PDF document in landscape for better table fit
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Page dimensions
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const tableStartY = 70;
    
    // ----------------------------
    // HEADER SECTION
    // ----------------------------
    
    // Logo or Church Name Box
    doc.setFillColor(41, 128, 185); // Blue background
    doc.roundedRect(margin, margin, pageWidth - (margin * 2), 25, 3, 3, 'F');
    
    // Church Name
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("GOFAMINT TITHE COLLECTION REPORT", pageWidth / 2, margin + 12, { align: "center" });
    
    // Report Type
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Monthly Tithe Record", pageWidth / 2, margin + 20, { align: "center" });
    
    // ----------------------------
    // ASSEMBLY INFO SECTION
    // ----------------------------
    const infoY = margin + 35;
    
    // Assembly Info Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, infoY, pageWidth - (margin * 2), 25, 3, 3, 'F');
    
    // Assembly Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Assembly: ${assembly}`, margin + 10, infoY + 8);
    doc.text(`Report Date: ${moment().format("DD/MM/YYYY")}`, margin + 10, infoY + 16);
    
    // Statistics
    const paidMembers = filteredData.filter(member => (member.total || 0) > 0).length;
    const unpaidMembers = filteredData.length - paidMembers;
    
    doc.text(`Total Members: ${filteredData.length}`, pageWidth - margin - 100, infoY + 8);
    doc.text(`Paid: ${paidMembers} | Unpaid: ${unpaidMembers}`, pageWidth - margin - 100, infoY + 16);
    doc.text(`Total Collection: ₦${totals.total.toLocaleString()}`, pageWidth - margin - 100, infoY + 24);
    
    // ----------------------------
    // TABLE HEADERS
    // ----------------------------
    
    // Prepare table data
    const tableHeaders = [
      { header: "S/N", dataKey: "sn", width: 15 },
      { header: "NAME", dataKey: "name", width: 60 },
      { header: "TITHE NO.", dataKey: "titheNumber", width: 25 },
      { header: "WEEK 1", dataKey: "week1", width: 30 },
      { header: "WEEK 2", dataKey: "week2", width: 30 },
      { header: "WEEK 3", dataKey: "week3", width: 30 },
      { header: "WEEK 4", dataKey: "week4", width: 30 },
      { header: "WEEK 5", dataKey: "week5", width: 30 },
      { header: "TOTAL", dataKey: "total", width: 35 },
    ];

    const tableData = filteredData.map((member) => ({
      sn: member.sn.toString(),
      name: member.name,
      titheNumber: member.titheNumber || "-",
      week1: member.week1 && member.week1 > 0 ? `₦${member.week1.toLocaleString()}` : "-",
      week2: member.week2 && member.week2 > 0 ? `₦${member.week2.toLocaleString()}` : "-",
      week3: member.week3 && member.week3 > 0 ? `₦${member.week3.toLocaleString()}` : "-",
      week4: member.week4 && member.week4 > 0 ? `₦${member.week4.toLocaleString()}` : "-",
      week5: member.week5 && member.week5 > 0 ? `₦${member.week5.toLocaleString()}` : "-",
      total: `₦${member.total?.toLocaleString()}`,
    }));

    // ----------------------------
    // GENERATE TABLE
    // ----------------------------
    autoTable(doc, {
      head: [tableHeaders.map(h => h.header)],
      body: tableData.map(row => tableHeaders.map(h => row[h.dataKey as keyof typeof row])),
      startY: tableStartY,
      margin: { left: margin, right: margin },
      theme: "striped",
      headStyles: {
        fillColor: [52, 152, 219], // Blue header
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
        cellPadding: 5,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      columnStyles: tableHeaders.reduce((styles, col, index) => {
        styles[index] = { 
          cellWidth: col.width,
          halign: col.dataKey === 'name' ? 'left' : 
                  col.dataKey === 'titheNumber' ? 'center' : 
                  ['week1', 'week2', 'week3', 'week4', 'week5', 'total'].includes(col.dataKey) ? 'right' : 'center'
        };
        return styles;
      }, {} as Record<number, any>),
      styles: {
        overflow: 'linebreak',
        cellWidth: 'wrap',
      },
      didParseCell: (data) => {
        // Get column index
        const columnIndex = data.column.index;
        const dataKey = tableHeaders[columnIndex]?.dataKey;
        
        if (!dataKey) return;
        
        // Style the total column differently
        if (dataKey === 'total') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [41, 128, 185]; // Blue color
        }
        
        // Style paid amounts for week columns
        const weekColumns = ['week1', 'week2', 'week3', 'week4', 'week5'];
        if (weekColumns.includes(dataKey) && data.cell.raw !== '-') {
          data.cell.styles.textColor = [39, 174, 96]; // Green color for paid amounts
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: (data) => {
        const pageNumber = data.pageNumber;
        const totalPages = doc.getNumberOfPages();
        
        // ----------------------------
        // FOOTER SECTION
        // ----------------------------
        const footerY = pageHeight - 25;
        
        // Left section: Signatures
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        
        doc.text("Prepared by:", margin, footerY);
        doc.text("___________________", margin + 25, footerY);
        
        doc.text("Approved by:", margin, footerY + 8);
        doc.text("___________________", margin + 25, footerY + 8);
        
        doc.text("Date:", margin, footerY + 16);
        doc.text("___________________", margin + 25, footerY + 16);
        
        // Right section: Page info and summary
        const rightX = pageWidth - margin - 60;
        doc.setFont("helvetica", "italic");
        doc.text(`Page ${pageNumber} of ${totalPages}`, rightX, footerY);
        doc.text(`Generated: ${moment().format("DD/MM/YYYY HH:mm")}`, rightX, footerY + 8);
        doc.text(`Total: ₦${totals.total.toLocaleString()}`, rightX, footerY + 16);
        
        // ----------------------------
        // SUMMARY BOX (on first page only)
        // ----------------------------
        if (pageNumber === 1) {
          const summaryY = tableStartY + (data.cursor?.y || 0) + 15;
          
          if (summaryY < pageHeight - 40) {
            // Summary box
            doc.setFillColor(240, 248, 255);
            doc.roundedRect(margin, summaryY, pageWidth - (margin * 2), 25, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(41, 128, 185);
            doc.text("SUMMARY", margin + 10, summaryY + 10);
            
            doc.setFont("helvetica", "normal");
            doc.setTextColor(0, 0, 0);
            
            // Summary details
            const summaryText = [
              `Total Members: ${filteredData.length}`,
              `Paid Members: ${paidMembers}`,
              `Unpaid Members: ${unpaidMembers}`,
              `Collection Rate: ${((paidMembers / filteredData.length) * 100).toFixed(1)}%`,
              `Average per Member: ₦${(totals.total / (paidMembers || 1)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            ];
            
            let xPos = margin + 80;
            summaryText.forEach((text, index) => {
              doc.text(text, xPos, summaryY + 10 + (index * 5));
            });
            
            // Weekly totals
            doc.setFont("helvetica", "bold");
            doc.text("Weekly Totals:", pageWidth - margin - 120, summaryY + 10);
            doc.setFont("helvetica", "normal");
            
            const weekTotals = [
              `Week 1: ₦${totals.week1.toLocaleString()}`,
              `Week 2: ₦${totals.week2.toLocaleString()}`,
              `Week 3: ₦${totals.week3.toLocaleString()}`,
              `Week 4: ₦${totals.week4.toLocaleString()}`,
              totals.week5 > 0 ? `Week 5: ₦${totals.week5.toLocaleString()}` : ""
            ].filter(Boolean);
            
            weekTotals.forEach((text, index) => {
              doc.text(text, pageWidth - margin - 120, summaryY + 15 + (index * 5));
            });
          }
        }
      },
    });

    // ----------------------------
    // ADD FINAL TOUCHES
    // ----------------------------
    
    // Add watermark on first page
    doc.setFontSize(40);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(230, 230, 230);
    doc.text("GOFAMINT", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });

    // Reset color for any final text
    doc.setTextColor(0, 0, 0);

    // Save PDF
    doc.save(`Tithe_Report_${assembly.replace(/\s+/g, '_')}_${moment().format("MMMM_YYYY")}.pdf`);

    notification.success({
      message: "PDF Report Generated",
      description: "Professional PDF report downloaded successfully",
    });
  } catch (error) {
    console.error("PDF export error:", error);
    notification.error({
      message: "PDF Export Failed",
      description: "Failed to generate PDF report",
    });
  }
};
  // Dropdown menu items for export
  const exportMenuItems = [
    {
      key: "excel",
      label: "Export as Excel (CSV)",
      icon: <FileExcelOutlined />,
      onClick: exportToExcel,
    },
    {
      key: "pdf",
      label: "Export as PDF",
      icon: <FilePdfOutlined />,
      onClick: exportToPDF,
    },
  ];

  const columns = [
    {
      data: "sn",
      title: "S/N",
      type: "numeric",
      width: 80,
      className: "htCenter",
    },
    {
      data: "name",
      title: "Name",
      width: 250,
      readOnly: true,
    },
    {
      data: "titheNumber",
      title: "Tithe #",
      width: 100,
      readOnly: true,
    },
    {
      data: "week1",
      title: "Week 1",
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "₦0,0",
      },
    },
    {
      data: "week2",
      title: "Week 2",
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "₦0,0",
      },
    },
    {
      data: "week3",
      title: "Week 3",
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "₦0,0",
      },
    },
    {
      data: "week4",
      title: "Week 4",
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "₦0,0",
      },
    },
    {
      data: "week5",
      title: "Week 5",
      type: "numeric",
      width: 100,
      numericFormat: {
        pattern: "₦0,0",
      },
    },
    {
      data: "total",
      title: "Total",
      type: "numeric",
      width: 120,
      readOnly: true,
      numericFormat: {
        pattern: "₦0,0",
      },
    },
  ];

  // Fixed: Properly typed cell change handler
  const handleCellChange = (
    changes: CellChange[] | null,
    source: ChangeSource
  ) => {
    if (!changes || source !== "edit") return;

    changes.forEach((change) => {
      const [row, prop, oldValue, newValue] = change;

      if (typeof prop !== "string") return;

      if (["week1", "week2", "week3", "week4", "week5"].includes(prop)) {
        const updatedData = [...filteredData];
        const typedProp = prop as keyof TitheMember;

        // Type-safe assignment
        if (
          typedProp === "week1" ||
          typedProp === "week2" ||
          typedProp === "week3" ||
          typedProp === "week4" ||
          typedProp === "week5"
        ) {
          updatedData[row][typedProp] = newValue as number;

          // Recalculate total
          const newTotal =
            (updatedData[row].week1 || 0) +
            (updatedData[row].week2 || 0) +
            (updatedData[row].week3 || 0) +
            (updatedData[row].week4 || 0) +
            (updatedData[row].week5 || 0);

          updatedData[row].total = newTotal;
          setFilteredData(updatedData);
        }
      }
    });
  };

  // Fixed: Proper renderer function with correct types
  const createCellRenderer = () => {
    return function (
      this: any,
      instance: Handsontable.Core,
      td: HTMLTableCellElement,
      row: number,
      column: number,
      prop: string | number,
      value: any,
      cellProperties: Handsontable.CellProperties
    ) {
      // Default renderer
      Handsontable.renderers.NumericRenderer.apply(this, [
        instance,
        td,
        row,
        column,
        prop,
        value,
        cellProperties,
      ] as Parameters<typeof Handsontable.renderers.NumericRenderer>);

      // Apply styling based on value
      const weekCols = ["week1", "week2", "week3", "week4", "week5"];
      const propStr = prop.toString();

      if (weekCols.includes(propStr)) {
        const numValue = Number(value);
        if (numValue > 0) {
          td.style.backgroundColor = "#f0fff4";
          td.style.fontWeight = "bold";
          td.style.color = "#059669";
        }
      }

      if (propStr === "total") {
        const numValue = Number(value);
        if (numValue > 0) {
          td.style.backgroundColor = "#dbeafe";
          td.style.fontWeight = "bold";
        }
      }
    };
  };

  // Apply renderer to all cells
  const cellRenderer = createCellRenderer();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading spreadsheet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-800">
            Tithe Collection Spreadsheet
          </h1>
          <p className="text-blue-600">
            Edit weekly tithe amounts directly in the spreadsheet
          </p>
        </div>
        <Space>
          <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]}>
            <Button icon={<FileExcelOutlined />}>
              Export <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BankOutlined className="mr-2" />
              Select Assembly
            </label>
            <Select
              value={assembly}
              onChange={setAssembly}
              className="w-full md:w-64"
              placeholder="Choose assembly..."
              size="large"
            >
              {allData.map((assemblyData) => (
                <Option
                  key={assemblyData.assembly}
                  value={assemblyData.assembly}
                >
                  {assemblyData.assembly} ({assemblyData.members.length}{" "}
                  members)
                </Option>
              ))}
            </Select>
          </div>

          {assembly && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{filteredData.length}</span> members
              in {assembly}
            </div>
          )}
        </div>
      </div>

      {assembly && filteredData.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {assembly} - Member Tithe Records
              </h2>
              <div className="text-sm text-gray-500">
                Double-click cells to edit amounts
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <HotTable
              ref={hotTableRef}
              data={filteredData}
              columns={columns}
              colHeaders={true}
              rowHeaders={false}
              width="100%"
              height="600px"
              licenseKey="non-commercial-and-evaluation"
              stretchH="all"
              filters={true}
              dropdownMenu={true}
              contextMenu={true}
              manualColumnResize={true}
              manualRowResize={true}
              afterChange={handleCellChange}
              cells={function () {
                return {
                  renderer: cellRenderer,
                };
              }}
            />
          </div>

          <div className="border-t bg-gray-50 p-4">
            <div className="grid grid-cols-4 md:grid-cols-10 gap-4">
              <div className="md:col-span-3 font-semibold text-gray-700">
                Assembly Totals:
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Week 1</div>
                <div className="font-bold text-green-600">
                  ₦{totals.week1.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Week 2</div>
                <div className="font-bold text-green-600">
                  ₦{totals.week2.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Week 3</div>
                <div className="font-bold text-green-600">
                  ₦{totals.week3.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Week 4</div>
                <div className="font-bold text-green-600">
                  ₦{totals.week4.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Week 5</div>
                <div className="font-bold text-green-600">
                  ₦{totals.week5.toLocaleString()}
                </div>
              </div>
              <div className="text-right md:col-span-2">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-bold text-blue-600 text-lg">
                  ₦{totals.total.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <SearchOutlined className="text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700">
            {allData.length === 0 ? "No Data Available" : "Select an Assembly"}
          </h3>
          <p className="text-gray-500 mt-2">
            {allData.length === 0
              ? "No tithe data found. Please check your data source."
              : "Choose an assembly from the dropdown above to view members."}
          </p>
        </div>
      )}
    </div>
  );
};

export default TitheSpreadsheet;