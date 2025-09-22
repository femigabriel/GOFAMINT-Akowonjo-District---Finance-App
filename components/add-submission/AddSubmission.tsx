// app/submissions/add/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  message,
  Typography,
  Tooltip,
  Popconfirm,
  DatePicker,
  Spin,
  Table,
  Collapse,
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
import { useAuth } from "@/context/AuthContext";

const { Title, Text } = Typography;
const { MonthPicker } = DatePicker;
const { Panel } = Collapse;

interface Submission {
  week: string;
  date: string;
  tithe: number;
  offeringGeneral: number;
  offeringSpecial: number;
  welfare: number;
  missionaryFund: number;
  total: number;
  remarks: string;
}

interface CustomNumberCell extends NumberCell {
  nonEditable?: boolean;
}

type CustomCellTypes = DefaultCellTypes | CustomNumberCell;

// Initialize 4 weeks of data
const initialData: Submission[] = Array.from({ length: 4 }, (_, index) => ({
  week: `Week ${index + 1}`,
  date: dayjs().startOf("month").add(index, "week").format("YYYY-MM-DD"),
  tithe: 0,
  offeringGeneral: 0,
  offeringSpecial: 0,
  welfare: 0,
  missionaryFund: 0,
  total: 0,
  remarks: "",
}));

const columns: Column[] = [
  { columnId: "week", width: 150 },
  { columnId: "date", width: 180 },
  { columnId: "tithe", width: 160 },
  { columnId: "offeringGeneral", width: 180 },
  { columnId: "offeringSpecial", width: 180 },
  { columnId: "welfare", width: 160 },
  { columnId: "missionaryFund", width: 160 },
  { columnId: "total", width: 160 },
  { columnId: "remarks", width: 250 },
  { columnId: "actions", width: 100 },
];

const tableColumns = [
  { title: "Week", dataIndex: "week", key: "week" },
  { title: "Date", dataIndex: "date", key: "date" },
  {
    title: "Tithe (₦)",
    dataIndex: "tithe",
    key: "tithe",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "General Offering (₦)",
    dataIndex: "offeringGeneral",
    key: "offeringGeneral",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Special Offering (₦)",
    dataIndex: "offeringSpecial",
    key: "offeringSpecial",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Welfare (₦)",
    dataIndex: "welfare",
    key: "welfare",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Missionary Fund (₦)",
    dataIndex: "missionaryFund",
    key: "missionaryFund",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  {
    title: "Total (₦)",
    dataIndex: "total",
    key: "total",
    render: (value: number) =>
      value.toLocaleString("en-NG", { style: "currency", currency: "NGN" }),
  },
  { title: "Remarks", dataIndex: "remarks", key: "remarks" },
];

export default function AddSubmissionPage() {
  const { assembly, isAuthenticated, loading, logout } = useAuth();
  const [data, setData] = useState<Submission[]>(initialData);
  const [pageLoading, setPageLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));
  const router = useRouter();

  // Handle authentication check after loading
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !assembly) {
        message.error("Please log in again");
        router.push("/login");
      } else {
        // Fetch existing submissions
        fetchSubmissions();
      }
      setPageLoading(false);
    }
  }, [loading, isAuthenticated, assembly, router]);

  // Filter data by selected month and initialize 4 weeks
  useEffect(() => {
    if (!loading && isAuthenticated && assembly) {
      const startOfMonth = selectedMonth.startOf("month");
      const endOfMonth = selectedMonth.endOf("month");
      setData((prevData) =>
        prevData.filter((row) => {
          const rowDate = dayjs(row.date);
          return rowDate.isAfter(startOfMonth) && rowDate.isBefore(endOfMonth);
        }).length > 0
          ? prevData
          : Array.from({ length: 4 }, (_, index) => ({
              week: `Week ${index + 1}`,
              date: startOfMonth.add(index, "week").format("YYYY-MM-DD"),
              tithe: 0,
              offeringGeneral: 0,
              offeringSpecial: 0,
              welfare: 0,
              missionaryFund: 0,
              total: 0,
              remarks: "",
            }))
      );
      fetchSubmissions();
    }
  }, [selectedMonth, loading, isAuthenticated, assembly]);

  const fetchSubmissions = async () => {
    if (!assembly) return;
    try {
      const res = await fetch(`/api/submissions?assembly=${assembly}`);
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      } else {
        message.error("Failed to fetch submissions");
      }
    } catch (err) {
      message.error("Error fetching submissions");
    }
  };

  const handleChanges = (changes: CellChange<CustomCellTypes>[]) => {
    const newData = [...data];
    changes.forEach((change) => {
      const rowIdx = change.rowId as number;
      const columnId = change.columnId as string;

      if (columnId === "week" && change.type === "text") {
        newData[rowIdx].week = change.newCell.text;
      } else if (columnId === "date" && change.type === "text") {
        newData[rowIdx].date = change.newCell.text;
      } else if (
        change.type === "number" &&
        [
          "tithe",
          "offeringGeneral",
          "offeringSpecial",
          "welfare",
          "missionaryFund",
        ].includes(columnId)
      ) {
        if (change.newCell.value < 0) {
          message.error(`${columnId} must be non-negative`, 3);
          return;
        }
        newData[rowIdx][
          columnId as keyof Pick<
            Submission,
            | "tithe"
            | "offeringGeneral"
            | "offeringSpecial"
            | "welfare"
            | "missionaryFund"
          >
        ] = change.newCell.value;
        newData[rowIdx].total =
          (newData[rowIdx].tithe || 0) +
          (newData[rowIdx].offeringGeneral || 0) +
          (newData[rowIdx].offeringSpecial || 0) +
          (newData[rowIdx].welfare || 0) +
          (newData[rowIdx].missionaryFund || 0);
      } else if (columnId === "remarks" && change.type === "text") {
        newData[rowIdx].remarks = change.newCell.text;
      }
    });
    setData(newData);
  };

  const handleAddRow = () => {
    const weekNumber = data.length + 1;
    const newDate = selectedMonth
      .startOf("month")
      .add(weekNumber - 1, "week")
      .format("YYYY-MM-DD");
    setData([
      ...data,
      {
        week: `Week ${weekNumber}`,
        date: newDate,
        tithe: 0,
        offeringGeneral: 0,
        offeringSpecial: 0,
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
      "Total (₦)": row.total || 0,
      Remarks: row.remarks || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Submissions");
    XLSX.writeFile(
      wb,
      `submissions_${assembly || "assembly"}_${selectedMonth.format(
        "YYYY-MM"
      )}.xlsx`
    );
  };

  const handleSave = async () => {
    if (!assembly) {
      message.error("No assembly selected. Please log in again.");
      router.push("/login");
      return;
    }

    setPageLoading(true);
    const submissions = data.map((row) => ({
      week: row.week || "",
      date: row.date || "",
      tithe: Number(row.tithe || 0),
      offeringGeneral: Number(row.offeringGeneral || 0),
      offeringSpecial: Number(row.offeringSpecial || 0),
      welfare: Number(row.welfare || 0),
      missionaryFund: Number(row.missionaryFund || 0),
      total: Number(row.total || 0),
      remarks: row.remarks || "",
    }));

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assembly, submissions }),
      });
      if (res.ok) {
        message.success({
          content: "Submissions saved successfully!",
          duration: 3,
          icon: <SaveOutlined style={{ color: "#ffd700" }} />,
        });
        fetchSubmissions(); // Refresh submissions table
        router.push("/dashboard");
      } else {
        const errorData = await res.json();
        message.error(errorData.error || "Save failed", 3);
      }
    } catch (err) {
      message.error("Error saving submissions", 3);
    } finally {
      setPageLoading(false);
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 placeholder-gray-400 text-sm"
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
                  fontSize: "14px",
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
                  newData[idx].total =
                    (newData[idx].tithe || 0) +
                    (newData[idx].offeringGeneral || 0) +
                    (newData[idx].offeringSpecial || 0) +
                    (newData[idx].welfare || 0) +
                    (newData[idx].missionaryFund || 0);
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 text-sm"
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
                  newData[idx].total =
                    (newData[idx].tithe || 0) +
                    (newData[idx].offeringGeneral || 0) +
                    (newData[idx].offeringSpecial || 0) +
                    (newData[idx].welfare || 0) +
                    (newData[idx].missionaryFund || 0);
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 text-sm"
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
                  newData[idx].total =
                    (newData[idx].tithe || 0) +
                    (newData[idx].offeringGeneral || 0) +
                    (newData[idx].offeringSpecial || 0) +
                    (newData[idx].welfare || 0) +
                    (newData[idx].missionaryFund || 0);
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 text-sm"
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
                  newData[idx].total =
                    (newData[idx].tithe || 0) +
                    (newData[idx].offeringGeneral || 0) +
                    (newData[idx].offeringSpecial || 0) +
                    (newData[idx].welfare || 0) +
                    (newData[idx].missionaryFund || 0);
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 text-sm"
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
                  newData[idx].total =
                    (newData[idx].tithe || 0) +
                    (newData[idx].offeringGeneral || 0) +
                    (newData[idx].offeringSpecial || 0) +
                    (newData[idx].welfare || 0) +
                    (newData[idx].missionaryFund || 0);
                  setData(newData);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 text-sm"
                placeholder="₦0"
                min="0"
              />
            </Tooltip>
          ),
        } as CustomNumberCell,
        {
          type: "number",
          value: row.total || 0,
          nonEditable: true,
          renderer: () =>
            (row.total || 0).toLocaleString("en-NG", {
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition-colors bg-white text-gray-800 placeholder-gray-400 text-sm"
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

  // Show loading spinner while checking auth
  if (pageLoading || loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 sm:p-6 md:p-8 min-h-screen flex flex-col bg-gray-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Text className="text-blue-900 font-bold tracking-tight text-2xl sm:text-3xl">
            GOFAMINT Akowonjo District
          </Text>
          <Text className="text-blue-900 font-semibold text-xl sm:text-2xl block">
            Weekly Financial Submission
          </Text>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <Text className="text-gray-700 font-medium">Select Month:</Text>
          <MonthPicker
            value={selectedMonth}
            onChange={(date) =>
              setSelectedMonth(date || dayjs().startOf("month"))
            }
            format="MMMM YYYY"
            className="border-none bg-transparent w-full sm:w-auto"
            placeholder="Select month"
          />
        </div>
      </div>

      <Card
  className="mb-6"
  style={{
    background: "linear-gradient(145deg, #ffffff, #f8fafc)",
    borderRadius: "14px",
    boxShadow: "0 6px 24px rgba(0, 0, 0, 0.08)",
    fontFamily: "'Inter', sans-serif",
  }}
>
  <Collapse
    bordered={false}
    defaultActiveKey={["1"]}
    expandIconPosition="end"
    style={{ background: "transparent" }}
  >
    <Panel
      header={
        <Title level={4} className="text-blue-900 m-0 font-semibold">
          Submission Instructions
        </Title>
      }
      key="1"
    >
      <Text className="text-gray-700 text-base leading-relaxed block mb-4">
        Use this page to <strong>record and manage weekly financial submissions</strong> 
        for {assembly || "your assembly"}. Totals are calculated automatically 
        to help ensure accuracy.
      </Text>

      <div className="space-y-2 text-gray-700 text-base">
        <p className="font-medium text-blue-800">Quick Steps:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Enter weekly figures (Tithe, Offerings, Welfare, Missionary Fund) in the grid.
          </li>
          <li>
            Pick the correct <strong>Date</strong> for each submission.
          </li>
          <li>
            Add <strong>Remarks</strong> if extra notes are needed.
          </li>
          <li>
            Use <strong>Add Row</strong> to include more weeks.
          </li>
          <li>
            Click <strong>Save to DB</strong> to securely store submissions.
          </li>
          <li>
            Use <strong>Export to Excel</strong> for reporting and records.
          </li>
          <li>
            View past submissions below the grid for reference.
          </li>
        </ul>
      </div>
    </Panel>
  </Collapse>
</Card>


      <Card
        className="mb-6 w-full"
        style={{
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Inter', sans-serif",
          border: "1px solid #e2e8f0",
        }}
      >
        <div className="overflow-x-auto">
          <ReactGrid
            rows={rows}
            columns={columns}
            onCellsChanged={handleChanges}
            enableFillHandle={true}
            enableRangeSelection={true}
            stickyTopRows={1}
          />
        </div>
      </Card>
      <motion.div
        className="flex flex-wrap gap-3 justify-start mb-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Button
          type="primary"
          onClick={handleSave}
          loading={pageLoading}
          icon={<SaveOutlined />}
          className="bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md text-sm sm:text-base"
        >
          Save to DB
        </Button>
        <Button
          onClick={handleAddRow}
          icon={<PlusOutlined />}
          className="border-blue-200 hover:border-blue-600 bg-white text-blue-600 font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md text-sm sm:text-base"
        >
          Add Row
        </Button>
        <Button
          onClick={handleExport}
          icon={<DownloadOutlined />}
          className="border-blue-200 hover:border-blue-600 bg-white text-blue-600 font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md text-sm sm:text-base"
        >
          Export to Excel
        </Button>
        <Button
          onClick={() => router.push("/dashboard")}
          icon={<CloseOutlined />}
          className="border-gray-200 hover:border-blue-600 bg-white text-gray-600 font-semibold rounded-lg px-6 py-2 transition-all duration-300 shadow-md text-sm sm:text-base"
        >
          Cancel
        </Button>
      </motion.div>

      <Card
        className="mb-6 w-full"
        style={{
          background: "linear-gradient(145deg, #ffffff, #f8fafc)",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Title level={4} className="text-blue-900 mb-4">
          Past Submissions
        </Title>
        <Table
          columns={tableColumns}
          dataSource={submissions}
          rowKey={(record) => `${record.week}-${record.date}`}
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
      </Card>
    </motion.div>
  );
}
