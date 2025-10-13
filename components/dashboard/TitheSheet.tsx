"use client";

import React, { useRef, useEffect, useState } from "react";
import "jspreadsheet-ce/dist/jspreadsheet.css";
import "jsuites/dist/jsuites.css";

interface TitheRow {
  name: string;
  amount: number;
  week: string;
  month: string;
  year: string;
}

const initialData: TitheRow[] = [
  { name: "John Doe", amount: 5000, week: "1", month: "October", year: "2025" },
  { name: "Mary Jane", amount: 7000, week: "2", month: "October", year: "2025" },
];

const TitheSheet: React.FC = () => {
  const spreadsheetRef = useRef<HTMLDivElement | null>(null);
  const jspreadsheetInstance = useRef<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterWeek, setFilterWeek] = useState("");
  const [filterYear, setFilterYear] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !spreadsheetRef.current) return;

    const init = async () => {
      try {
        const { default: jspreadsheet } = await import("jspreadsheet-ce");
        console.log("Jspreadsheet loaded:", typeof jspreadsheet); // Debug: Should log "function"

        if (!jspreadsheetInstance.current) {
          jspreadsheetInstance.current = jspreadsheet(spreadsheetRef.current as HTMLDivElement, {
            worksheets: [
              {
                data: initialData.map((row) => [
                  row.name,
                  row.amount,
                  row.week,
                  row.month,
                  row.year,
                ]),
                columns: [
                  { type: "text", title: "Name", width: 200 },
                  { type: "number", title: "Amount (₦)", width: 120 },
                  {
                    type: "dropdown",
                    title: "Week",
                    width: 100,
                    source: ["1", "2", "3", "4"],
                  },
                  {
                    type: "dropdown",
                    title: "Month",
                    width: 120,
                    source: [
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December",
                    ],
                  },
                  { type: "text", title: "Year", width: 100 },
                ],
                allowInsertRow: true,
                allowInsertColumn: false,
                allowDeleteRow: true,
                allowDeleteColumn: false,
                tableOverflow: true,
                tableHeight: "400px",
                minDimensions: [5, 10],
                contextMenu: true,
              },
            ],
          });
        }
      } catch (err) {
        console.error("Jspreadsheet init error:", err);
      }
    };

    init();

    return () => {
      if (jspreadsheetInstance.current) {
        jspreadsheetInstance.current.destroy();
        jspreadsheetInstance.current = null;
      }
    };
  }, [isMounted]);

  const updateSummaryRow = () => {
    const instance = jspreadsheetInstance.current;
    if (!instance?.getWorksheet(0)?.getData) return;

    const worksheet = instance.getWorksheet(0);
    const rows = worksheet.getData();
    const total = rows.reduce((sum: number, r: any[]) => sum + (parseFloat(r[1]) || 0), 0);
    const rowCount = rows.length;
    worksheet.setValue(`A${rowCount + 1}`, "Total:", true);
    worksheet.setValue(`B${rowCount + 1}`, total.toString(), true);
  };

  const handleFilter = () => {
    const worksheet = jspreadsheetInstance.current?.getWorksheet(0);
    if (!worksheet?.getData || !worksheet?.setData) return;

    const data = worksheet.getData();
    const filtered = data.filter((row: any[]) => {
      const name = String(row[0]).toLowerCase();
      const week = row[2];
      const month = row[3];
      const year = row[4];
      return (
        (!searchTerm || name.includes(searchTerm.toLowerCase())) &&
        (!filterMonth || month === filterMonth) &&
        (!filterWeek || week === filterWeek) &&
        (!filterYear || year === filterYear)
      );
    });
    worksheet.setData(filtered);
  };

  const addNewRow = () => {
    const worksheet = jspreadsheetInstance.current?.getWorksheet(0);
    if (worksheet?.insertRow) {
      worksheet.insertRow();
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Tithe Records</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search name..."
          className="border rounded p-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border rounded p-2"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All Months</option>
          {[
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December",
          ].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={filterWeek}
          onChange={(e) => setFilterWeek(e.target.value)}
        >
          <option value="">All Weeks</option>
          {["1", "2", "3", "4"].map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <input
          placeholder="Year"
          className="border rounded p-2 w-24"
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
        />
        <button
          onClick={handleFilter}
          className="bg-blue-600 text-white px-3 py-2 rounded"
        >
          Filter
        </button>
        <button
          onClick={updateSummaryRow}
          className="bg-green-600 text-white px-3 py-2 rounded"
        >
          Update Total
        </button>
        <button
          onClick={addNewRow}
          className="bg-purple-600 text-white px-3 py-2 rounded"
        >
          Add Row
        </button>
      </div>

      <div ref={spreadsheetRef} className="overflow-x-auto border rounded" />
    </div>
  );
};

export default TitheSheet;