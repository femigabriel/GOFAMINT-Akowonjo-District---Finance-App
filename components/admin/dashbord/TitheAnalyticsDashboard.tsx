// components/TitheSpreadsheet.tsx
"use client";


import React, { useState, useEffect, useRef } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import { registerAllModules } from "handsontable/registry";
import "handsontable/dist/handsontable.full.min.css";
import { Select } from "antd";
import { BankOutlined, SearchOutlined } from "@ant-design/icons";
import Handsontable from "handsontable";
import type { CellChange, ChangeSource } from "handsontable/common";

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
              // Apply renderer to all cells
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
