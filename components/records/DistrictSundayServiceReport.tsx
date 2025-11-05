"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { HotTable, HotTableClass } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  Button,
  Modal,
  notification,
  Space,
  Statistic,
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
  isSunday,
} from "date-fns";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";

registerAllCellTypes();

interface SundayServiceRow {
  attendance: number;
  sbsAttendance: number;
  visitors: number;
  tithes: number;
  offerings: number;
  specialOfferings: number;
  etf: number;
  pastorsWarfare: number;
  vigil: number;
  thanksgiving: number;
  retirees: number;
  missionaries: number;
  youthOfferings: number;
  districtSupport: number;
  total: number;
  totalAttendance: number;
  [key: string]: number;
}

interface SundayServiceRecord {
  week: string;
  date: string;
  attendance: number;
  sbsAttendance: number;
  visitors: number;
  tithes: number;
  offerings: number;
  specialOfferings: number;
  etf: number;
  pastorsWarfare: number;
  vigil: number;
  thanksgiving: number;
  retirees: number;
  missionaries: number;
  youthOfferings: number;
  districtSupport: number;
  total: number;
  [key: string]: string | number;
}

interface CustomColumn {
  name: string;
  key: string;
}

const { useBreakpoint } = Grid;

const DistrictSundayServiceReport: React.FC = () => {
  const hotRef = useRef<HotTableClass>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<SundayServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState<string>("");
  const { assembly } = useAuth();
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const screens = useBreakpoint();

  const customColumns: CustomColumn[] = [
    { name: "ETF", key: "etf" },
    { name: "Pastor's Warfare", key: "pastorsWarfare" },
    { name: "Vigil", key: "vigil" },
    { name: "Thanksgiving", key: "thanksgiving" },
    { name: "Retirees", key: "retirees" },
    { name: "Missionaries", key: "missionaries" },
    { name: "Youth Offerings", key: "youthOfferings" },
    { name: "District Support", key: "districtSupport" },
  ];

  /* --------------------------------------------------------------
     1. ONLY Sundays that fall INSIDE the selected month
     -------------------------------------------------------------- */
  const monthSundays = useMemo(() => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end })
      .filter((date): boolean => isSunday(date))
      .slice(0, 5); // max 5, never pad
  }, [selectedDate]);

  const rowCount = monthSundays.length;

  const rowHeaders = useMemo(() => {
    return monthSundays.map((d, i) => `Week ${i + 1} (${format(d, "d/M")})`);
  }, [monthSundays]);

  const initializeEmptyData = useCallback(() => {
    return Array.from({ length: rowCount }, () => ({
      attendance: 0,
      sbsAttendance: 0,
      visitors: 0,
      tithes: 0,
      offerings: 0,
      specialOfferings: 0,
      etf: 0,
      pastorsWarfare: 0,
      vigil: 0,
      thanksgiving: 0,
      retirees: 0,
      missionaries: 0,
      youthOfferings: 0,
      districtSupport: 0,
      total: 0,
      totalAttendance: 0,
    }));
  }, [rowCount]);

  /* --------------------------------------------------------------
     2. Columns (editable + read-only totals)
     -------------------------------------------------------------- */
  const getColumns = useCallback(() => {
    const isMobile = !screens.md;
    const baseWidth = screens.lg ? 120 : screens.md ? 100 : 80;

    const columns: any[] = [];

    const fields = [
      { key: "attendance", title: "Attendance", color: "bg-blue-50" },
      { key: "sbsAttendance", title: "SBS", color: "bg-green-50" },
      { key: "visitors", title: "Visitors", color: "bg-yellow-50" },
      { key: "tithes", title: "Tithes (₦)", color: "bg-purple-50" },
      { key: "offerings", title: "Offerings (₦)", color: "bg-pink-50" },
      { key: "specialOfferings", title: "Special (₦)", color: "bg-indigo-50" },
      ...customColumns.map((c) => ({
        key: c.key,
        title: c.name + " (₦)",
        color: "bg-gray-50",
      })),
    ];

    fields.forEach((f) => {
      columns.push({
        data: f.key,
        type: "numeric",
        width: isMobile ? Math.max(70, baseWidth - 20) : baseWidth,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value ?? 0;
          td.style.textAlign = "right";
          td.style.padding = isMobile ? "4px 6px" : "8px 12px";
          td.style.fontSize = isMobile ? "12px" : "14px";
          td.className = `htNumeric ${f.color} hover:bg-opacity-80 transition-colors`;
        },
      });
    });

    // ---- Total Attendance (read-only) ----
    columns.push({
      data: "totalAttendance",
      type: "numeric",
      readOnly: true,
      width: isMobile ? Math.max(70, baseWidth - 20) : baseWidth,
      renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
        td.innerHTML = value ? value.toLocaleString() : 0;
        td.style.textAlign = "right";
        td.style.padding = isMobile ? "4px 6px" : "8px 12px";
        td.style.fontSize = isMobile ? "12px" : "14px";
        td.className = "htNumeric bg-cyan-100 font-semibold";
      },
    });

    // ---- Monetary Total (read-only) ----
    columns.push({
      data: "total",
      type: "numeric",
      readOnly: true,
      width: isMobile ? Math.max(70, baseWidth - 20) : baseWidth,
      renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
        td.innerHTML = value ? value.toLocaleString() : 0;
        td.style.textAlign = "right";
        td.style.padding = isMobile ? "4px 6px" : "8px 12px";
        td.style.fontSize = isMobile ? "12px" : "14px";
        td.className = "htNumeric bg-gray-200 font-semibold hover:bg-gray-300 transition-colors";
      },
    });

    return columns;
  }, [screens, customColumns]);

  const colHeaders = useMemo(() => {
    const isMobile = !screens.md;
    const base = isMobile
      ? ["Att", "SBS", "Vis", "Tithes", "Offer", "Spec", ...customColumns.map((c) => c.name.split(" ")[0])]
      : [
          "Attendance",
          "SBS",
          "Visitors",
          "Tithes (₦)",
          "Offerings (₦)",
          "Special (₦)",
          ...customColumns.map((c) => c.name + " (₦)"),
        ];
    return [...base, "Total Att.", "Total (₦)"];
  }, [screens, customColumns]);

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
        )}&month=${encodeURIComponent(month)}`
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const { records } = await resp.json();

      console.log("Fetched records:", records); // DEBUG
      console.log("Month Sundays:", monthSundays.map(d => format(d, "yyyy-MM-dd"))); // DEBUG

      const filled: SundayServiceRow[] = monthSundays.map((sun, index) => {
        const dateStr = format(sun, "yyyy-MM-dd");
        
        // Try exact match first
        let saved = records.find((r: any) => r.date === dateStr);
        
        // If no exact match, try matching by week number as fallback
        if (!saved && records[index]) {
          saved = records[index];
        }

        if (saved) {
          return {
            attendance: saved.attendance || 0,
            sbsAttendance: saved.sbsAttendance || 0,
            visitors: saved.visitors || 0,
            tithes: saved.tithes || 0,
            offerings: saved.offerings || 0,
            specialOfferings: saved.specialOfferings || 0,
            etf: saved.etf || 0,
            pastorsWarfare: saved.pastorsWarfare || 0,
            vigil: saved.vigil || 0,
            thanksgiving: saved.thanksgiving || 0,
            retirees: saved.retirees || 0,
            missionaries: saved.missionaries || 0,
            youthOfferings: saved.youthOfferings || 0,
            districtSupport: saved.districtSupport || 0,
            total: saved.total || 0,
            totalAttendance: saved.totalAttendance || 0,
          };
        }

        // Return empty row
        return initializeEmptyData()[0];
      });

      console.log("Final filled data:", filled); // DEBUG
      setData(filled);
    } catch (e: any) {
      console.error(e);
      notification.error({ message: "Load error", description: e.message });
      setData(initializeEmptyData());
    } finally {
      setLoading(false);
    }
  }, [assembly, selectedDate, initializeEmptyData, monthSundays]);

  const confirmSave = async () => {
    try {
      await form.validateFields();

      console.log("About to save with assembly:", assembly);

      const payload = data
        .map((row, i) => ({
          week: `Week ${i + 1}`,
          date: format(monthSundays[i], "yyyy-MM-dd"),
          ...row,
        }))
        .filter((r) => Object.values(r).some((v) => typeof v === "number" && v > 0));

      if (!payload.length) {
        notification.error({ message: "Nothing to save" });
        return;
      }

      console.log("Sending payload:", { assembly, submittedBy, month: monthKey(selectedDate), records: payload });

      setLoading(true);
      const resp = await fetch("/api/sunday-service-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assembly,
          submittedBy,
          month: monthKey(selectedDate),
          records: payload,
        }),
      });

      // FIXED: Add response handling
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const result = await resp.json();
      
      // Show success notification
      notification.success({
        message: "Successfully Saved!",
        description: `Sunday service report for ${format(selectedDate, "MMMM yyyy")} has been saved.`,
      });

      // Close modal and reset form
      setIsModalOpen(false);
      form.resetFields();
      setSubmittedBy("");

      // Refresh data to get the latest from server
      fetchInitialRecords();

    } catch (e: any) {
      console.error(e);
      notification.error({ 
        message: "Save Failed", 
        description: e.message || "Failed to save Sunday service report. Please try again." 
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
        const copy = [...prev];
        changes.forEach(([row, prop, , newVal]) => {
          copy[row] = { ...copy[row], [prop as string]: Number(newVal) || 0 };
        });
        copy.forEach((r) => {
          // FIXED: Calculate total attendance as sum of all attendance types
          r.totalAttendance = r.attendance + r.sbsAttendance + r.visitors;
          r.total =
            r.tithes +
            r.offerings +
            r.specialOfferings +
            r.etf +
            r.pastorsWarfare +
            r.vigil +
            r.thanksgiving +
            r.retirees +
            r.missionaries +
            r.youthOfferings +
            r.districtSupport;
        });
        return copy;
      });
    },
    []
  );

  // FIXED: Calculate total attendance properly
  const summaryStats = useMemo(() => {
    return data.reduce(
      (a, r) => {
        a.serviceAttendance += r.attendance;
        a.sbsAttendance += r.sbsAttendance;
        a.visitors += r.visitors;
        a.totalAttendance += r.attendance + r.sbsAttendance + r.visitors; // Sum all attendance types
        a.totalTithes += r.tithes;
        a.totalOfferings += r.total;
        return a;
      },
      { 
        serviceAttendance: 0, 
        sbsAttendance: 0, 
        visitors: 0, 
        totalAttendance: 0, 
        totalTithes: 0, 
        totalOfferings: 0 
      }
    );
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
    const headers = ["Week", "Date", ...colHeaders];
    const rows = data.map((r, i) => [
      `Week ${i + 1}`,
      format(monthSundays[i], "yyyy-MM-dd"),
      r.attendance,
      r.sbsAttendance,
      r.visitors,
      r.tithes,
      r.offerings,
      r.specialOfferings,
      r.etf,
      r.pastorsWarfare,
      r.vigil,
      r.thanksgiving,
      r.retirees,
      r.missionaries,
      r.youthOfferings,
      r.districtSupport,
      r.totalAttendance,
      r.total,
    ]);
    const csv = [headers, ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SundayService-${format(selectedDate, "MMMM-yyyy")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMonthChange = (m: moment.Moment | null) => {
    if (m) setSelectedDate(m.toDate());
  };

  const tableHeight = useMemo(() => {
    const rowH = screens.md ? 42 : 36;
    return rowH * (rowCount + 1) + 10; 
  }, [screens, rowCount]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
      {/* Header + Month picker */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CalendarOutlined className="text-white text-lg" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                Sunday Service Report
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {format(selectedDate, "MMMM yyyy")} • {assembly}
              </p>
            </div>
          </div>

          <DatePicker.MonthPicker
            value={moment(selectedDate)}
            onChange={handleMonthChange}
            className="rounded-lg w-full sm:w-auto"
            size={screens.xs ? "small" : "middle"}
            allowClear={false}
          />
        </div>

        {/* FIXED: 3 equal cards with proper total calculation */}
        <Row gutter={[12, 12]}>
          {/* Total Attendance Card */}
          <Col xs={24} sm={8} lg={8}>
            <Card
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <div className="text-center">
                <div className="text-blue-100 text-sm font-semibold mb-2">Total Attendance</div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  {summaryStats.totalAttendance.toLocaleString()}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center border-t border-blue-400 pt-3">
                  <div>
                    <div className="text-blue-100 text-xs">Service</div>
                    <div className="text-white font-semibold text-sm">{summaryStats.serviceAttendance.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-blue-100 text-xs">SBS</div>
                    <div className="text-white font-semibold text-sm">{summaryStats.sbsAttendance.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-blue-100 text-xs">Visitors</div>
                    <div className="text-white font-semibold text-sm">{summaryStats.visitors.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Total Tithes Card */}
          <Col xs={24} sm={8} lg={8}>
            <Card
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <div className="text-center">
                <div className="text-purple-100 text-sm font-semibold mb-2">Total Tithes</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  ₦{summaryStats.totalTithes.toLocaleString()}
                </div>
              </div>
            </Card>
          </Col>

          {/* All Offerings Card */}
          <Col xs={24} sm={8} lg={8}>
            <Card
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <div className="text-center">
                <div className="text-pink-100 text-sm font-semibold mb-2">All Offerings</div>
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  ₦{summaryStats.totalOfferings.toLocaleString()}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="text-sm text-gray-500">
          {screens.md && "Edit any cell – totals update instantly."}
        </div>
        <Space
          wrap
          size={[8, 8]}
          className={`flex ${screens.xs ? "justify-stretch" : "justify-end"} gap-2`}
        >
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            size={screens.xs ? "small" : "middle"}
            className="bg-green-600 text-white hover:bg-green-700 rounded-lg"
            block={screens.xs}
          >
            {screens.sm && "Export"}
          </Button>

          <Popconfirm
            title="Reset?"
            description="Clear all data?"
            onConfirm={handleClear}
            okText="Yes"
            cancelText="No"
          >
            <Button
              icon={<ReloadOutlined />}
              size={screens.xs ? "small" : "middle"}
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg"
              block={screens.xs}
            >
              {screens.sm && "Reset"}
            </Button>
          </Popconfirm>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size={screens.xs ? "small" : "middle"}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg"
            block={screens.xs}
          >
            {screens.sm && "Save"}
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
        title={<div className="flex items-center gap-2">Confirm Save</div>}
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
      `}</style>
    </div>
  );
};

export default DistrictSundayServiceReport;