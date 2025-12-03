// components/dashboard/MidweekServiceReport.tsx
"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  Button,
  Modal,
  notification,
  Space,
  Card,
  Row,
  Col,
  Popconfirm,
  DatePicker,
  Form,
  Input,
  Spin,
  Grid,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isTuesday,
  isThursday,
} from "date-fns";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";

registerAllCellTypes();

interface MidweekServiceRecord {
  date: string;
  day: "tuesday" | "thursday";
  attendance: number;
  offering: number;
  total: number;
  submittedBy: string;
  [key: string]: string | number;
}

const { useBreakpoint } = Grid;

interface MidweekServiceReportProps {
  assembly: string | null;
}

const MidweekServiceReport: React.FC<MidweekServiceReportProps> = ({ assembly }) => {
  const hotRef = useRef<HotTableClass>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState<string>("");
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const screens = useBreakpoint();


  const monthMidweekDays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end })
      .filter((date): boolean => isTuesday(date) || isThursday(date))
      .slice(0, 10); 
  }, [selectedDate]);

  const colCount = monthMidweekDays.length;

  const colHeaders = useMemo(() => {
    return monthMidweekDays.map((d) => {
      const dayName = isTuesday(d) ? "Tue" : "Thu";
      return `${dayName} ${format(d, "d/M")}`;
    });
  }, [monthMidweekDays]);

  const rowHeaders = useMemo(() => {
    const isMobile = !screens.md;
    return isMobile ? ["Att", "Off", "Tot"] : ["Attendance", "Offering (₦)", "Total (₦)"];
  }, [screens]);

  const initializeEmptyData = useCallback(() => {
    return Array.from({ length: 3 }, () => Array(colCount).fill(0));
  }, [colCount]);

  /* --------------------------------------------------------------
     2. Columns (dynamic based on dates)
     -------------------------------------------------------------- */
  const getColumns = useCallback(() => {
    const isMobile = !screens.md;
    const baseWidth = screens.lg ? 120 : screens.md ? 100 : 80;

    const columnConfig = {
      type: "numeric",
      width: isMobile ? Math.max(70, baseWidth - 20) : baseWidth,
      renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
        td.style.textAlign = "right";
        td.style.padding = isMobile ? "4px 6px" : "8px 12px";
        td.style.fontSize = isMobile ? "12px" : "14px";

        if (row === 0) {
          td.innerHTML = value ?? 0;
          td.className = "htNumeric bg-blue-50 hover:bg-opacity-80 transition-colors";
        } else {
          td.innerHTML = value ? `₦${value.toLocaleString()}` : "₦0";
          td.className =
            row === 1
              ? "htNumeric bg-green-50 hover:bg-opacity-80 transition-colors"
              : "htNumeric bg-gray-200 font-semibold hover:bg-gray-300 transition-colors";
        }
      },
    };

    return Array(colCount).fill(columnConfig);
  }, [screens, colCount]);

  const cells = useCallback((row: number, col: number, prop: any) => {
    if (row === 2) {
      return { readOnly: true };
    }
    return {};
  }, []);

  const monthKey = (d: Date) => format(d, "MMMM-yyyy");

  const fetchInitialRecords = useCallback(async () => {
    if (!assembly) {
      setData(initializeEmptyData());
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const month = monthKey(selectedDate);
      const resp = await fetch(
        `/api/sunday-service-reports?assembly=${encodeURIComponent(
          assembly
        )}&month=${encodeURIComponent(month)}&serviceType=midweek`
      );
      
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const { records } = await resp.json();

      console.log("Fetched midweek records:", records);
      console.log("Month Midweek Days:", monthMidweekDays.map(d => format(d, "yyyy-MM-dd")));

      const att: number[] = [];
      const off: number[] = [];
      const tot: number[] = [];

      monthMidweekDays.forEach((day, index) => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayName = isTuesday(day) ? "tuesday" : "thursday";
        
        // Try exact match first
        let saved = records.find((r: any) => r.date === dateStr && r.day === dayName);
        
        // If no exact match, try matching by index as fallback
        if (!saved && records[index]) {
          saved = records[index];
        }

        att.push(saved?.attendance || 0);
        off.push(saved?.offering || 0);
        tot.push(saved?.total || 0);
      });

      console.log("Final filled midweek data:", [att, off, tot]);
      setData([att, off, tot]);
    } catch (e: any) {
      console.error(e);
      notification.error({ message: "Load error", description: e.message });
      setData(initializeEmptyData());
    } finally {
      setLoading(false);
    }
  }, [assembly, selectedDate, initializeEmptyData, monthMidweekDays]);

  const confirmSave = async () => {
    try {
      await form.validateFields();

      const payload = monthMidweekDays
        .map((dayDate, i) => {
          return {
            date: format(dayDate, "yyyy-MM-dd"),
            day: isTuesday(dayDate) ? "tuesday" : "thursday",
            attendance: data[0][i],
            offering: data[1][i],
            total: data[2][i],
          };
        })
        .filter((r) => Object.values(r).some((v) => typeof v === "number" && v > 0));

      if (!payload.length) {
        notification.error({ message: "Nothing to save" });
        return;
      }

      console.log("Sending midweek payload:", { 
        assembly, 
        submittedBy, 
        month: monthKey(selectedDate), 
        records: payload,
        serviceType: "midweek" 
      });

      setLoading(true);
      const resp = await fetch("/api/sunday-service-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assembly,
          submittedBy,
          month: monthKey(selectedDate),
          records: payload,
          serviceType: "midweek"
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const result = await resp.json();
      
      notification.success({
        message: "Successfully Saved!",
        description: `Midweek service report for ${format(selectedDate, "MMMM yyyy")} has been saved.`,
      });

      setIsModalOpen(false);
      form.resetFields();
      setSubmittedBy("");
      fetchInitialRecords();

    } catch (e: any) {
      console.error(e);
      notification.error({ 
        message: "Save Failed", 
        description: e.message || "Failed to save midweek service report. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialRecords();
  }, [fetchInitialRecords]);
  
const afterChange = useCallback(
  (changes: CellChange[] | null, source: ChangeSource) => {
    if (!changes || source === "loadData") return;

    setData((prev) => {
      const copy = prev.map((r) => [...r]);

      changes.forEach(([row, col, , newVal]) => {
        const colIndex = col as number; // Explicit cast
        copy[row][colIndex] = Number(newVal) || 0;
      });

      // Update totals (total = offering for each column)
      for (let c = 0; c < copy[0].length; c++) {
        copy[2][c] = copy[1][c];
      }

      return copy;
    });
  },
  []
);
  const summaryStats = useMemo(() => {
    return {
      totalAttendance: data[0]?.reduce((a, v) => a + v, 0) || 0,
      totalOffering: data[1]?.reduce((a, v) => a + v, 0) || 0,
      totalAmount: data[2]?.reduce((a, v) => a + v, 0) || 0,
    };
  }, [data]);

  const handleSave = () => {
    if (!assembly) return notification.error({ message: "No assembly" });
    setIsModalOpen(true);
  };

  const handleClear = () => {
    Modal.confirm({
      title: "Reset",
      content: "Clear all entries?",
      onOk: () => setData(initializeEmptyData()),
    });
  };

  const handleExport = () => {
    const headers = [
      "Metric",
      ...monthMidweekDays.map((d) => {
        const dayName = isTuesday(d) ? "Tuesday" : "Thursday";
        return `${dayName} ${format(d, "yyyy-MM-dd")}`;
      }),
    ];
    const rows = [
      ["Attendance", ...data[0]],
      ["Offering", ...data[1]],
      ["Total", ...data[2]],
    ];
    const csv = [headers, ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MidweekService-${format(selectedDate, "MMMM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // FIXED: Calendar date picker - set default to current month/year
  const handleMonthChange = (m: moment.Moment | null) => {
    if (m) setSelectedDate(m.toDate());
  };

  const tableHeight = useMemo(() => {
    const rowH = screens.md ? 42 : 36;
    return rowH * 4 + 10; // 3 rows + header
  }, [screens]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
      {/* Header + Month picker */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <CalendarOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                Midweek Service Report
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {format(selectedDate, "MMMM yyyy")} • {assembly} • Tuesdays & Thursdays
              </p>
            </div>
          </div>

          {/* FIXED: Calendar shows current year/month by default */}
          <DatePicker
            picker="month"
            value={moment(selectedDate)}
            onChange={handleMonthChange}
            className="rounded-lg w-full sm:w-auto"
            size={screens.xs ? "small" : "middle"}
            allowClear={false}
            format="MMMM YYYY"
            disabledDate={(current) => {
              // Optional: You can restrict date range here if needed
              return current && (current.year() < 2020 || current.year() > 2030);
            }}
          />
        </div>

        {/* Stats Cards */}
        <Row gutter={[12, 12]}>
          {/* Total Attendance Card */}
          <Col xs={24} sm={8} lg={8}>
            <Card
              className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <div className="text-center">
                <div className="text-green-100 text-sm font-semibold mb-2">Total Attendance</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  {summaryStats.totalAttendance.toLocaleString()}
                </div>
              </div>
            </Card>
          </Col>

          {/* Total Offering Card */}
          <Col xs={24} sm={8} lg={8}>
            <Card
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <div className="text-center">
                <div className="text-purple-100 text-sm font-semibold mb-2">Total Offering</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  ₦{summaryStats.totalOffering.toLocaleString()}
                </div>
              </div>
            </Card>
          </Col>

          {/* Total Amount Card */}
          <Col xs={24} sm={8} lg={8}>
            <Card
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <div className="text-center">
                <div className="text-orange-100 text-sm font-semibold mb-2">Total Amount</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  ₦{summaryStats.totalAmount.toLocaleString()}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Action buttons - FIXED: Made bigger for mobile with visible text */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="text-sm text-gray-500">
          {screens.md && "Edit any cell – totals update instantly."}
        </div>
        <Space
          wrap
          size={[12, 12]}
          className={`flex ${screens.xs ? "justify-stretch" : "justify-end"} gap-3`}
        >
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            size="large"
            className="bg-green-600 text-white hover:bg-green-700 rounded-lg h-12 px-4"
            style={{ 
              minWidth: screens.xs ? "120px" : "auto",
              fontSize: screens.xs ? "14px" : "inherit"
            }}
          >
            <span className="ml-1">Export</span>
          </Button>

          <Popconfirm
            title="Reset all data?"
            description="This will clear all entries in the table."
            onConfirm={handleClear}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<ReloadOutlined />}
              size="large"
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg h-12 px-4"
              style={{ 
                minWidth: screens.xs ? "120px" : "auto",
                fontSize: screens.xs ? "14px" : "inherit"
              }}
            >
              <span className="ml-1">Reset</span>
            </Button>
          </Popconfirm>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size="large"
            className="bg-blue-600 hover:bg-blue-700 rounded-lg h-12 px-4"
            style={{ 
              minWidth: screens.xs ? "120px" : "auto",
              fontSize: screens.xs ? "14px" : "inherit"
            }}
          >
            <span className="ml-1">Save</span>
          </Button>
        </Space>
      </div>

      {/* Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
            <Spin size="large" tip="Loading…" />
          </div>
        )}
        <div
          className="handsontable-container border rounded-lg shadow-sm bg-white overflow-hidden"
          style={{ height: tableHeight, fontSize: screens.xs ? "12px" : "14px" }}
        >
          <HotTable
            ref={hotRef}
            data={data}
            colHeaders={colHeaders}
            columns={getColumns()}
            rowHeaders={rowHeaders}
            afterChange={afterChange}
            cells={cells}
            stretchH="all"
            autoRowSize={true}
            autoColumnSize={false}
            minSpareRows={0}
            contextMenu={true}
            licenseKey="non-commercial-and-evaluation"
            className="htCore custom-handsontable"
            rowHeaderWidth={screens.xs ? 80 : 100}
          />
        </div>
      </div>

      {/* Save modal */}
      <Modal
        title={<div className="flex items-center gap-2">Confirm Save - Midweek Services</div>}
        open={isModalOpen}
        onOk={confirmSave}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSubmittedBy("");
        }}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ loading, className: "bg-blue-600 hover:bg-blue-700 rounded-lg h-10" }}
        width={screens.xs ? 350 : 500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="submittedBy"
            label="Submitted By"
            rules={[{ required: true, message: "Enter your name" }]}
          >
            <Input
              placeholder="Full name"
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              className="rounded-lg h-10"
              prefix={<UserOutlined />}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .custom-handsontable .htCore { font-size: ${screens.xs ? "12px" : "14px"}; }
        .custom-handsontable th { font-weight: 600; background:#f8fafc; padding:${screens.xs ? "6px 8px" : "8px 12px"}; }
        .custom-handsontable td:hover { background:#f1f5f9 !important; }
        
        /* Make mobile buttons more touch-friendly */
        @media (max-width: 640px) {
          .ant-btn {
            height: 48px !important;
            font-size: 15px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default MidweekServiceReport;