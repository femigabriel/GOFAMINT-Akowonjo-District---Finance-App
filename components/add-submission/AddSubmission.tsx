// app/submissions/add/page.tsx
"use client";

import { useState } from "react";
import {
  Button,
  Card,
  message,
  Typography,
  Spin,
  Tooltip,
  Popconfirm,
} from "antd";
import {
  ReactGrid,
  Column,
  Row,
  DefaultCellTypes,
  NumberCell,
  TextCell,
  HeaderCell,
  CellChange,
} from "@silevis/reactgrid";
import "@silevis/reactgrid/styles.css";
import { useRouter } from "next/navigation";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import {
  SaveOutlined,
  PlusOutlined,
  DownloadOutlined,
  CloseOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";

const { Title, Text } = Typography;

interface Submission {
  week: string;
  date: string;
  tithe?: number;
  offeringGeneral?: number;
  offeringSpecial?: number;
  welfare?: number;
  missionaryFund?: number;
  total?: number;
  remarks?: string;
}

interface CustomNumberCell extends NumberCell {
  nonEditable?: boolean;
}

type CustomCellTypes = DefaultCellTypes | CustomNumberCell;

const initialData: Partial<Submission>[] = [
  {
    week: "Week 1",
    date: new Date().toISOString().split("T")[0],
    offeringGeneral: 0,
    offeringSpecial: 0,
    tithe: 0,
    welfare: 0,
    missionaryFund: 0,
    total: 0,
    remarks: "",
  },
];

const columns: Column[] = [
  { columnId: "week", width: 120 },
  { columnId: "date", width: 160 },
  { columnId: "tithe", width: 140 },
  { columnId: "offeringGeneral", width: 160 },
  { columnId: "offeringSpecial", width: 160 },
  { columnId: "welfare", width: 140 },
  { columnId: "missionaryFund", width: 140 },
  { columnId: "total", width: 140 },
  { columnId: "remarks", width: 220 },
];

export default function AddSubmissionPage() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChanges = (changes: CellChange<CustomCellTypes>[]) => {
    const newData = [...data];
    changes.forEach((change) => {
      const rowIdx = change.rowId as number;
      const columnId = change.columnId as string;

      if (columnId === "offeringGeneral" || columnId === "offeringSpecial") {
        if (change.type === "number") {
          if (change.newCell.value < 0) {
            message.error(`${columnId} must be non-negative`, 3);
            return;
          }
          newData[rowIdx][columnId as "offeringGeneral" | "offeringSpecial"] =
            change.newCell.value;
        }
      } else if (change.type === "text") {
        if (columnId === "week" || columnId === "remarks") {
          newData[rowIdx][columnId as "week" | "remarks"] = change.newCell.text;
        }
      } else if (change.type === "number" && columnId !== "total") {
        if (change.newCell.value < 0) {
          message.error(`${columnId} must be non-negative`, 3);
          return;
        }
        newData[rowIdx][columnId as "tithe" | "welfare" | "missionaryFund"] =
          change.newCell.value;
      }
    });
    setData(newData);
  };

  const handleAddRow = () => {
    setData([
      ...data,
      {
        week: `Week ${data.length + 1}`,
        date: new Date().toISOString().split("T")[0],
        offeringGeneral: 0,
        offeringSpecial: 0,
        tithe: 0,
        welfare: 0,
        missionaryFund: 0,
        total: 0,
        remarks: "",
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    if (data.length === 1) {
      message.warning("At least one row is required", 3);
      return;
    }
    setData(data.filter((_, idx) => idx !== index));
  };

  const handleExport = () => {
    const exportData = data.map((row) => ({
      Week: row.week || "",
      Date: row.date || "",
      "Tithe (₦)": row.tithe || 0,
      "General Offering (₦)": row.offeringGeneral || 0,
      "Special Offering (₦)": row.offeringSpecial || 0,
      "Welfare (₦)": row.welfare || 0,
      "Missionary Fund (₦)": row.missionaryFund || 0,
      "Total (₦)":
        (row.tithe || 0) +
        (row.offeringGeneral || 0) +
        (row.offeringSpecial || 0) +
        (row.welfare || 0) +
        (row.missionaryFund || 0),
      Remarks: row.remarks || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(
      wb,
      `submissions_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const handleSave = async () => {
    setLoading(true);
    const submissions = data.map((row) => ({
      week: row.week || "",
      date: row.date || "",
      tithe: Number(row.tithe || 0),
      offeringGeneral: Number(row.offeringGeneral || 0),
      offeringSpecial: Number(row.offeringSpecial || 0),
      welfare: Number(row.welfare || 0),
      missionaryFund: Number(row.missionaryFund || 0),
      total:
        Number(row.tithe || 0) +
        Number(row.offeringGeneral || 0) +
        Number(row.offeringSpecial || 0) +
        Number(row.welfare || 0) +
        Number(row.missionaryFund || 0),
      remarks: row.remarks || "",
    }));

    try {
      const assembly = localStorage.getItem("assembly") || "akowonjo";
      const res = await fetch(
        `/api/submissions?assembly=${encodeURIComponent(assembly)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ submissions, assembly }),
        }
      );
      if (res.ok) {
        message.success({
          content: "Submissions saved successfully!",
          duration: 3,
          icon: <SaveOutlined style={{ color: "#ffd700" }} />,
        });
        router.push("/dashboard");
      } else {
        const errorData = await res.json();
        message.error(errorData.error || "Save failed", 3);
      }
    } catch (err) {
      message.error("Error saving submissions", 3);
    } finally {
      setLoading(false);
    }
  };

  const rows: Row<CustomCellTypes>[] = [
    {
      rowId: "header",
      cells: [
        { type: "header", text: "Week" } as HeaderCell,
        { type: "header", text: "Date" } as HeaderCell,
        { type: "header", text: "Tithe (₦)" } as HeaderCell,
        { type: "header", text: "General Offering (₦)" } as HeaderCell,
        { type: "header", text: "Special Offering (₦)" } as HeaderCell,
        { type: "header", text: "Welfare (₦)" } as HeaderCell,
        { type: "header", text: "Missionary Fund (₦)" } as HeaderCell,
        { type: "header", text: "Total (₦)" } as HeaderCell,
        { type: "header", text: "Remarks" } as HeaderCell,
        { type: "header", text: "Actions" } as HeaderCell,
      ],
    },
    ...data.map((row, idx) => ({
      rowId: idx,
      cells: [
        {
          type: "text",
          text: row.week || "",
          renderer: () => (
            <Tooltip title="Enter the week (e.g., Week 1)">
              <input
                value={row.week || ""}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].week = e.target.value;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 placeholder-gray-400"
                placeholder="Week"
              />
            </Tooltip>
          ),
        } as TextCell,
        {
          type: "text",
          text: row.date || "",
          renderer: () => (
            <Tooltip title="Select the submission date">
              <DatePicker
                value={row.date ? dayjs(row.date) : null}
                onChange={(date) => {
                  const newData = [...data];
                  newData[idx].date = date ? date.format("YYYY-MM-DD") : "";
                  setData(newData);
                }}
                format="YYYY-MM-DD"
                style={{
                  width: "100%",
                  borderRadius: "6px",
                  padding: "8px",
                  borderColor: "#d1d5db",
                }}
                placeholder="Select date"
              />
            </Tooltip>
          ),
        } as TextCell,
        {
          type: "number",
          value: row.tithe || 0,
          renderer: () => (
            <Tooltip title="Enter tithe amount">
              <input
                type="number"
                value={row.tithe || 0}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].tithe = Number(e.target.value) || 0;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800"
                placeholder="₦0"
                min="0"
              />
            </Tooltip>
          ),
        } as CustomNumberCell,
        {
          type: "number",
          value: row.offeringGeneral || 0,
          renderer: () => (
            <Tooltip title="Enter general offering amount">
              <input
                type="number"
                value={row.offeringGeneral || 0}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].offeringGeneral = Number(e.target.value) || 0;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800"
                placeholder="₦0"
                min="0"
              />
            </Tooltip>
          ),
        } as CustomNumberCell,
        {
          type: "number",
          value: row.offeringSpecial || 0,
          renderer: () => (
            <Tooltip title="Enter special offering amount">
              <input
                type="number"
                value={row.offeringSpecial || 0}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].offeringSpecial = Number(e.target.value) || 0;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800"
                placeholder="₦0"
                min="0"
              />
            </Tooltip>
          ),
        } as CustomNumberCell,
        {
          type: "number",
          value: row.welfare || 0,
          renderer: () => (
            <Tooltip title="Enter welfare amount">
              <input
                type="number"
                value={row.welfare || 0}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].welfare = Number(e.target.value) || 0;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800"
                placeholder="₦0"
                min="0"
              />
            </Tooltip>
          ),
        } as CustomNumberCell,
        {
          type: "number",
          value: row.missionaryFund || 0,
          renderer: () => (
            <Tooltip title="Enter missionary fund amount">
              <input
                type="number"
                value={row.missionaryFund || 0}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].missionaryFund = Number(e.target.value) || 0;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800"
                placeholder="₦0"
                min="0"
              />
            </Tooltip>
          ),
        } as CustomNumberCell,
        {
          type: "number",
          value:
            (row.tithe || 0) +
            (row.offeringGeneral || 0) +
            (row.offeringSpecial || 0) +
            (row.welfare || 0) +
            (row.missionaryFund || 0),
          nonEditable: true,
          renderer: () =>
            (
              (row.tithe || 0) +
              (row.offeringGeneral || 0) +
              (row.offeringSpecial || 0) +
              (row.welfare || 0) +
              (row.missionaryFund || 0)
            ).toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            }),
          style: { color: "#ffd700", fontWeight: 600 },
        } as CustomNumberCell,
        {
          type: "text",
          text: row.remarks || "",
          renderer: () => (
            <Tooltip title="Add optional remarks">
              <input
                value={row.remarks || ""}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].remarks = e.target.value;
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 placeholder-gray-400"
                placeholder="Remarks"
              />
            </Tooltip>
          ),
        } as TextCell,
        {
          type: "text",
          text: "",
          renderer: () => (
            <Popconfirm
              title="Delete this row?"
              onConfirm={() => handleDeleteRow(idx)}
              okText="Yes"
              cancelText="No"
            >
              <Button
                type="text"
                icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                size="small"
                className="hover:bg-red-100 transition-colors"
              />
            </Popconfirm>
          ),
        } as TextCell,
      ],
    })),
  ];

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8  min-h-screen flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Title
        level={2}
        className="text-blue-900 mb-2 font-bold tracking-tight"
        style={{ fontSize: "2rem" }}
      >
        GOFAMINT Akowonjo - Add Submissions
      </Title>
      <Text className="text-gray-700 mb-6 block text-sm md:text-base leading-relaxed">
        Enter weekly financial data for your assembly. Totals are
        auto-calculated. Use the buttons to manage entries.
      </Text>
      <Card
        className="shadow-2xl border-0 rounded-xl mb-6 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
        }}
      >
        <ReactGrid
          rows={rows}
          columns={[...columns, { columnId: "actions", width: 80 }]}
          onCellsChanged={handleChanges}
          enableFillHandle={true}
          enableRangeSelection={true}
          stickyTopRows={1}
          style={{
            fontFamily: "'Inter', sans-serif",
            border: "1px solid #e2e8f0",
            background: "#fff",
            borderRadius: "8px",
          }}
        />
  
      </Card>
      <motion.div
        className="flex flex-wrap gap-3 justify-start"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Button
          type="primary"
          onClick={handleSave}
          loading={loading}
          icon={<SaveOutlined />}
          className="bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md"
        >
          Save to DB
        </Button>
        <Button
          onClick={handleAddRow}
          icon={<PlusOutlined />}
          className="border-blue-200 hover:border-blue-600 bg-white text-blue-600 font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md"
        >
          Add Row
        </Button>
        <Button
          onClick={handleExport}
          icon={<DownloadOutlined />}
          className="border-blue-200 hover:border-blue-600 bg-white text-blue-600 font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md"
        >
          Export to Excel
        </Button>
        <Button
          onClick={() => router.push("/dashboard")}
          icon={<CloseOutlined />}
          className="border-gray-200 hover:border-blue-600 bg-white text-gray-600 font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md"
        >
          Cancel
        </Button>
      </motion.div>
    </motion.div>
  );
}
