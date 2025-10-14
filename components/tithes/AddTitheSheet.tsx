// components/AddTitheSheet.tsx
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  Button,
  DatePicker,
  Modal,
  notification,
  Space,
  Statistic,
  Tooltip,
  Input,
  Form,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  PlusOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import moment from "moment";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

registerAllCellTypes();

interface TitheRow {
  name: string;
  titheNumber: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5?: number;
  total: number;
}

const AddTitheSheet = () => {
  const hotRef = useRef<HotTableClass>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<TitheRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState<string>("");
  const { assembly } = useAuth(); 
  const [form] = Form.useForm();

  // Get Sundays of month
  const getSundays = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const sundays = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).filter(
      (date) => date >= start && date <= end
    );
    return sundays.map((sunday) => format(sunday, "d/M"));
  }, []);

  const sundays = useMemo(() => getSundays(selectedDate), [selectedDate, getSundays]);

  // Build headers dynamically
  const colHeaders = useMemo(
    () => [
      "Full Name",
      "Tithe Number",
      ...sundays.map((date, i) => `Week ${i + 1} (${date})`),
      "Total",
    ],
    [sundays]
  );

  // Initialize empty data for 200 rows
  const initializeEmptyData = useCallback(
    () =>
      Array.from({ length: 200 }, () => ({
        name: "",
        titheNumber: "",
        week1: 0,
        week2: 0,
        week3: 0,
        week4: 0,
        ...(sundays.length === 5 ? { week5: 0 } : {}),
        total: 0,
      })),
    [sundays]
  );

  // Fetch tither list from database
  const fetchTitherList = useCallback(async () => {
    if (!assembly) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/tithes?assembly=${encodeURIComponent(assembly)}`);
      const { titherList } = await response.json();
      if (titherList) {
        // Ensure exactly 200 rows
        const filledData = titherList.slice(0, 200);
        const remainingRows = 200 - filledData.length;
        if (remainingRows > 0) {
          filledData.push(...initializeEmptyData().slice(0, remainingRows));
        }
        setData(filledData);
      } else {
        setData(initializeEmptyData());
      }
    } catch (error) {
      console.error("Error fetching tither list:", error);
      notification.error({
        message: "Error",
        description: "Failed to load tither list. Starting with empty sheet.",
      });
      setData(initializeEmptyData());
    } finally {
      setLoading(false);
    }
  }, [assembly, initializeEmptyData]);

  // Initialize data on mount or when month/assembly changes
  useEffect(() => {
    fetchTitherList();
  }, [selectedDate, fetchTitherList]);

  // Handle changes and recalc totals
  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (changes && source !== "loadData") {
        setData((prevData) => {
          const newData = [...prevData];
          changes.forEach(([row, prop, , newValue]) => {
            const key = prop as keyof TitheRow;
            newData[row] = { ...newData[row], [key]: newValue };
            const { week1 = 0, week2 = 0, week3 = 0, week4 = 0, week5 = 0 } = newData[row];
            newData[row].total =
              Number(week1) +
              Number(week2) +
              Number(week3) +
              Number(week4) +
              (sundays.length === 5 ? Number(week5) : 0);
          });
          return newData;
        });
      }
    },
    [sundays]
  );

  // Compute grand total
  const grandTotal = useMemo(
    () => data.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [data]
  );

  // Save confirmation
  const handleSave = () => {
    if (!assembly) {
      notification.error({
        message: "Error",
        description: "No assembly selected. Please log in again.",
      });
      return;
    }
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    try {
      await form.validateFields();
      const filledData = data.filter(
        (r) =>
          r.name?.trim() &&
          r.titheNumber?.trim() &&
          (r.week1 > 0 || r.week2 > 0 || r.week3 > 0 || r.week4 > 0 || (r.week5 ?? 0) > 0)
      );

      if (filledData.length === 0) {
        notification.error({
          message: "Error",
          description: "No valid records to save.",
        });
        return;
      }

      setLoading(true);
      const response = await fetch("/api/tithes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assembly,
          submittedBy,
          month: moment(selectedDate).format("MMMM-YYYY"),
          records: filledData,
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        notification.success({
          message: "Data Saved Successfully",
          description: result.message,
          placement: "topRight",
        });
        setIsModalOpen(false);
        form.resetFields();
        setSubmittedBy("");
      } else {
        throw new Error(result.error || "Failed to save data");
      }
    } catch (error) {
      console.error("Error saving data:", error);
      notification.error({
        message: "Error",
        description: "Failed to save data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Toolbar actions
  const handleAddRows = () => {
    setData((prev) => {
      const newData = [...prev];
      if (newData.length < 200) {
        newData.push(...initializeEmptyData().slice(0, 200 - newData.length));
      }
      return newData.slice(0, 200); // Ensure exactly 200 rows
    });
  };

  const handleClear = () => {
    Modal.confirm({
      title: "Clear All Data",
      content: "This will reset the sheet to the initial tither list. Are you sure?",
      okText: "Yes, Clear",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => fetchTitherList(),
    });
  };

  const handleExport = () => {
    const csvData = [
      colHeaders.join(","),
      ...data.map((r) =>
        [
          r.name,
          r.titheNumber,
          r.week1,
          r.week2,
          r.week3,
          r.week4,
          sundays.length === 5 ? r.week5 : "",
          r.total,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Tithes-${moment(selectedDate).format("MMMM-YYYY")}.csv`);
    link.click();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50 rounded-t-md min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarOutlined /> Tithe Management Sheet
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <DatePicker.MonthPicker
            value={moment(selectedDate)}
            onChange={(date) => date && setSelectedDate(date.toDate())}
            format="MMMM YYYY"
            className="w-full sm:w-auto"
          />
          <Space
            wrap
            size={[8, 8]}
            className="flex justify-end flex-wrap gap-2"
          >
             <Tooltip title="Add more rows (up to 200)">
              <Link href="/submissions/add/offerings">
               <Button icon={<PlusOutlined />} >
                Add Offerings
              </Button>
              </Link>
             
            </Tooltip>
            <Tooltip title="Add more rows (up to 200)">
              <Button icon={<PlusOutlined />} onClick={handleAddRows} disabled={data.length >= 200}>
                Add Rows
              </Button>
            </Tooltip>
            <Tooltip title="Export to Excel">
              <Button icon={<FileExcelOutlined />} onClick={handleExport}>
                Export
              </Button>
            </Tooltip>
            <Tooltip title="Reset to initial tither list">
              <Button icon={<ReloadOutlined />} danger onClick={handleClear}>
                Reset
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
            >
              Save Data
            </Button>
          </Space>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border rounded-lg shadow-sm mb-4 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <Statistic
          title="Total Amount Recorded"
          value={grandTotal}
          prefix="₦"
          precision={2}
        />
        <span className="text-sm text-gray-500">
          Showing {data.length} rows — {moment(selectedDate).format("MMMM YYYY")}
        </span>
      </div>

      {/* Table */}
      <div
        className="handsontable-container border rounded-lg shadow-sm bg-white"
        style={{ height: "calc(100vh - 260px)", overflow: "auto" }}
      >
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={colHeaders}
          columns={[
            { data: "name", type: "text", width: 200 },
            { data: "titheNumber", type: "text", width: 150 },
            { data: "week1", type: "numeric", width: 120 },
            { data: "week2", type: "numeric", width: 120 },
            { data: "week3", type: "numeric", width: 120 },
            { data: "week4", type: "numeric", width: 120 },
            ...(sundays.length === 5
              ? [{ data: "week5", type: "numeric", width: 120 }]
              : []),
            { data: "total", type: "numeric", readOnly: true, width: 120 },
          ]}
          afterChange={afterChange}
          stretchH="all"
          autoRowSize={false}
          autoColumnSize={false}
          minSpareRows={0} // No extra rows beyond 200
          rowHeaders={true}
          contextMenu={true}
          licenseKey="non-commercial-and-evaluation"
          className="text-sm"
        />
      </div>

      {/* Save Modal */}
      <Modal
        title="Confirm Save"
        open={isModalOpen}
        onOk={confirmSave}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSubmittedBy("");
        }}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ type: "primary", loading }}
      >
        <p>Are you sure you want to save this month’s tithe data? Only filled rows will be saved.</p>
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="submittedBy"
            label="Submitted By (Full Name)"
            rules={[{ required: true, message: "Please enter your full name" }]}
          >
            <Input
              placeholder="Enter your full name"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddTitheSheet;