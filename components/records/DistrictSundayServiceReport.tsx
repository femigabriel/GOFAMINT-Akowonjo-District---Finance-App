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
  Tooltip,
  Form,
  Input,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, isSameMonth } from "date-fns";
import moment from "moment";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useAuth } from "@/context/AuthContext";

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
  [key: string]: number; // Index signature for dynamic access
}

interface SundayServiceRecord {
  week: string;
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
  [key: string]: string | number; // Index signature for API payload
}

interface CustomColumn {
  name: string;
  key: string;
}

const DistrictSundayServiceReport: React.FC = () => {
  const hotRef = useRef<HotTableClass>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<SundayServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState<string>("");
  const { assembly } = useAuth();
  const [form] = Form.useForm();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Predefined custom columns
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

  // Update selectedDate when the month changes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (!isSameMonth(now, selectedDate)) {
        setSelectedDate(now);
      }
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Get Sundays of the selected month
  const getMonthDates = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const sundays = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    return sundays.slice(0, 5);
  }, []);

  const monthDates = useMemo(() => getMonthDates(selectedDate), [selectedDate, getMonthDates]);

  const rowHeaders = useMemo(() => {
    return monthDates.map((date, i) => `Week ${i + 1} (${format(date, "d/M")})`);
  }, [monthDates]);

  // Initialize empty data for the table
  const initializeEmptyData = useCallback(() => {
    return Array.from({ length: monthDates.length }, () => ({
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
    }));
  }, [monthDates]);

  // Define table columns
  const getColumns = useCallback(() => {
    const columns: any[] = [];
    const fields = [
      { key: "attendance", title: "Attendance", color: "bg-blue-50" },
      { key: "sbsAttendance", title: "SBS Attendance", color: "bg-green-50" },
      { key: "visitors", title: "Visitors", color: "bg-yellow-50" },
      { key: "tithes", title: "Tithes (₦)", color: "bg-purple-50" },
      { key: "offerings", title: "Offerings (₦)", color: "bg-pink-50" },
      { key: "specialOfferings", title: "Special Offerings (₦)", color: "bg-indigo-50" },
      { key: "etf", title: "ETF (₦)", color: "bg-gray-50" },
      { key: "pastorsWarfare", title: "Pastor's Warfare (₦)", color: "bg-gray-50" },
      { key: "vigil", title: "Vigil (₦)", color: "bg-gray-50" },
      { key: "thanksgiving", title: "Thanksgiving (₦)", color: "bg-gray-50" },
      { key: "retirees", title: "Retirees (₦)", color: "bg-gray-50" },
      { key: "missionaries", title: "Missionaries (₦)", color: "bg-gray-50" },
      { key: "youthOfferings", title: "Youth Offerings (₦)", color: "bg-gray-50" },
      { key: "districtSupport", title: "District Support (₦)", color: "bg-gray-50" },
    ];

    fields.forEach((field) => {
      columns.push({
        data: field.key,
        type: "numeric",
        width: 120,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value || 0;
          td.style.textAlign = "right";
          td.className = `htNumeric ${field.color}`;
        },
      });
    });

    columns.push({
      data: "total",
      type: "numeric",
      readOnly: true,
      width: 120,
      renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
        td.innerHTML = value ? value.toLocaleString() : 0;
        td.style.textAlign = "right";
        td.className = "htNumeric bg-gray-200 font-semibold";
      },
    });

    return columns;
  }, []);

  const colHeaders = useMemo(() => {
    return [
      "Attendance",
      "SBS Attendance",
      "Visitors",
      "Tithes (₦)",
      "Offerings (₦)",
      "Special Offerings (₦)",
      ...customColumns.map((col) => col.name),
      "Total (₦)",
    ];
  }, []);

  // Fetch initial records from the API
  const fetchInitialRecords = useCallback(async () => {
    if (!assembly) {
      setData(initializeEmptyData());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const month = moment(selectedDate).format("MMMM-YYYY");
      const response = await fetch(
        `/api/sunday-service-reports?assembly=${encodeURIComponent(assembly)}&month=${encodeURIComponent(month)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const { records } = await response.json();
      const filledData: SundayServiceRow[] = [...records];
      while (filledData.length < monthDates.length) {
        filledData.push({
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
        });
      }
      setData(filledData.slice(0, monthDates.length));
    } catch (error) {
      console.error("Error fetching initial records:", error);
      notification.error({
        message: "Error",
        description: "Failed to load initial data. Starting with empty sheet.",
      });
      setData(initializeEmptyData());
    } finally {
      setLoading(false);
    }
  }, [assembly, selectedDate, initializeEmptyData, monthDates]);

  useEffect(() => {
    fetchInitialRecords();
  }, [fetchInitialRecords]);

  // Handle table changes
  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (changes && source !== "loadData") {
        setData((prevData) => {
          const newData = [...prevData];
          changes.forEach(([row, prop, , newValue]) => {
            newData[row] = { ...newData[row], [prop as string]: Number(newValue) || 0 };
            const rowData = newData[row];
            newData[row].total =
              (rowData.tithes || 0) +
              (rowData.offerings || 0) +
              (rowData.specialOfferings || 0) +
              (rowData.etf || 0) +
              (rowData.pastorsWarfare || 0) +
              (rowData.vigil || 0) +
              (rowData.thanksgiving || 0) +
              (rowData.retirees || 0) +
              (rowData.missionaries || 0) +
              (rowData.youthOfferings || 0) +
              (rowData.districtSupport || 0);
          });
          return newData;
        });
      }
    },
    []
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      totalAttendance: 0,
      totalSBSAttendance: 0,
      totalVisitors: 0,
      totalTithes: 0,
      totalOfferings: 0,
      totalSpecialOfferings: 0,
      totalETF: 0,
      totalPastorsWarfare: 0,
      totalVigil: 0,
      totalThanksgiving: 0,
      totalRetirees: 0,
      totalMissionaries: 0,
      totalYouthOfferings: 0,
      totalDistrictSupport: 0,
      grandTotal: 0,
    };
    data.forEach((row) => {
      stats.totalAttendance += row.attendance || 0;
      stats.totalSBSAttendance += row.sbsAttendance || 0;
      stats.totalVisitors += row.visitors || 0;
      stats.totalTithes += row.tithes || 0;
      stats.totalOfferings += row.offerings || 0;
      stats.totalSpecialOfferings += row.specialOfferings || 0;
      stats.totalETF += row.etf || 0;
      stats.totalPastorsWarfare += row.pastorsWarfare || 0;
      stats.totalVigil += row.vigil || 0;
      stats.totalThanksgiving += row.thanksgiving || 0;
      stats.totalRetirees += row.retirees || 0;
      stats.totalMissionaries += row.missionaries || 0;
      stats.totalYouthOfferings += row.youthOfferings || 0;
      stats.totalDistrictSupport += row.districtSupport || 0;
      stats.grandTotal += row.total || 0;
    });
    return stats;
  }, [data]);

  // Handle save action
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

  // Confirm and save data
  const confirmSave = async () => {
    try {
      await form.validateFields();

      const filledData: SundayServiceRecord[] = data
        .map((row, index) => ({
          week: `Week ${index + 1}`,
          attendance: row.attendance,
          sbsAttendance: row.sbsAttendance,
          visitors: row.visitors,
          tithes: row.tithes,
          offerings: row.offerings,
          specialOfferings: row.specialOfferings,
          etf: row.etf,
          pastorsWarfare: row.pastorsWarfare,
          vigil: row.vigil,
          thanksgiving: row.thanksgiving,
          retirees: row.retirees,
          missionaries: row.missionaries,
          youthOfferings: row.youthOfferings,
          districtSupport: row.districtSupport,
          total: row.total,
        }))
        .filter(
          (r) =>
            r.attendance > 0 ||
            r.sbsAttendance > 0 ||
            r.visitors > 0 ||
            r.tithes > 0 ||
            r.offerings > 0 ||
            r.specialOfferings > 0 ||
            r.etf > 0 ||
            r.pastorsWarfare > 0 ||
            r.vigil > 0 ||
            r.thanksgiving > 0 ||
            r.retirees > 0 ||
            r.missionaries > 0 ||
            r.youthOfferings > 0 ||
            r.districtSupport > 0
        );

      if (filledData.length === 0) {
        notification.error({
          message: "Error",
          description: "No valid records to save.",
        });
        return;
      }

      setLoading(true);

      const response = await fetch("/api/sunday-service-reports", {
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
        await fetchInitialRecords();
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

  // Handle reset action
  const handleClear = () => {
    Modal.confirm({
      title: "Reset Sheet",
      content: "This will reset the sheet to empty records. Are you sure?",
      okText: "Yes, Reset",
      cancelText: "Cancel",
      okButtonProps: { danger: true, className: "bg-red-600 text-white rounded-lg" },
      onOk: () => fetchInitialRecords(),
    });
  };

  // Handle export to CSV
  const handleExport = () => {
    const headers = ["Week", ...colHeaders];
    const csvData = [
      headers.join(","),
      ...data.map((row, index) => {
        const rowData: (string | number)[] = [
          `Week ${index + 1}`,
          row.attendance || 0,
          row.sbsAttendance || 0,
          row.visitors || 0,
          row.tithes || 0,
          row.offerings || 0,
          row.specialOfferings || 0,
          row.etf || 0,
          row.pastorsWarfare || 0,
          row.vigil || 0,
          row.thanksgiving || 0,
          row.retirees || 0,
          row.missionaries || 0,
          row.youthOfferings || 0,
          row.districtSupport || 0,
          row.total || 0,
        ];
        return rowData.join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `SundayServiceReport-${moment(selectedDate).format("MMMM-YYYY")}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle month change
  const handleMonthChange = (date: moment.Moment | null) => {
    if (date) {
      setSelectedDate(date.toDate());
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <CalendarOutlined className="text-blue-600" /> District Sunday Service Report
            <span className="text-base text-gray-500 ml-2">
              {moment(selectedDate).format("MMMM YYYY")}
            </span>
          </h3>
          <DatePicker.MonthPicker
            value={moment(selectedDate)}
            onChange={handleMonthChange}
            placeholder="Select month"
            className="rounded-lg"
          />
        </div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Attendance"
                value={summaryStats.totalAttendance}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total SBS Attendance"
                value={summaryStats.totalSBSAttendance}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Visitors"
                value={summaryStats.totalVisitors}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Tithes"
                value={summaryStats.totalTithes}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Offerings"
                value={summaryStats.totalOfferings}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Special Offerings"
                value={summaryStats.totalSpecialOfferings}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total ETF"
                value={summaryStats.totalETF}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Pastor's Warfare"
                value={summaryStats.totalPastorsWarfare}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Vigil"
                value={summaryStats.totalVigil}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Thanksgiving"
                value={summaryStats.totalThanksgiving}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Retirees"
                value={summaryStats.totalRetirees}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Missionaries"
                value={summaryStats.totalMissionaries}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total Youth Offerings"
                value={summaryStats.totalYouthOfferings}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl shadow-md">
              <Statistic
                title="Total District Support"
                value={summaryStats.totalDistrictSupport}
                prefix="₦"
                precision={2}
                valueStyle={{ color: "#fff" }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4 mb-6">
        <Space wrap size={[8, 8]} className="flex lg:justify-end flex-wrap gap-2">
          <Tooltip title="Export to Excel">
            <Button
              icon={<FileExcelOutlined />}
              onClick={handleExport}
              className="bg-green-600 text-white hover:bg-green-700 rounded-lg"
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Reset to empty records">
            <Popconfirm
              title="Reset the sheet?"
              description="This will clear all data and reset to empty records."
              onConfirm={handleClear}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true, className: "bg-red-600 text-white rounded-lg" }}
            >
              <Button
                icon={<ReloadOutlined />}
                className="bg-red-600 text-white hover:bg-red-700 rounded-lg"
              >
                Reset
              </Button>
            </Popconfirm>
          </Tooltip>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Save
          </Button>
        </Space>
      </div>

      <div
        className="handsontable-container border rounded-lg shadow-sm bg-white"
        style={{ height: "400px", overflow: "auto" }}
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
          className="htCore text-sm font-medium"
        />
      </div>

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
        okButtonProps={{ type: "primary", loading, className: "bg-blue-600 rounded-lg" }}
        cancelButtonProps={{ className: "rounded-lg" }}
      >
        <p>Are you sure you want to save this month’s Sunday Service Report? Only filled rows will be saved.</p>
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
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DistrictSundayServiceReport;