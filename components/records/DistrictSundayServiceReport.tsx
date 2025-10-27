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
  UsergroupAddOutlined,
  TeamOutlined,
  DollarOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, isSunday } from "date-fns";
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

  // Get all Sundays in the selected month
  const getMonthSundays = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const days = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    return days.filter((d) => isSunday(d)).slice(0, 5); // Limit to max 5 Sundays
  }, []);

  const monthSundays = useMemo(() => getMonthSundays(selectedDate), [selectedDate, getMonthSundays]);

  const rowHeaders = useMemo(() => {
    return monthSundays.map((date, i) => `Week ${i + 1} (${format(date, "d/M")})`);
  }, [monthSundays]);

  const initializeEmptyData = useCallback(() => {
    return Array.from({ length: monthSundays.length }, () => ({
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
  }, [monthSundays]);

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
      ...customColumns.map((col) => ({
        key: col.key,
        title: col.name + " (₦)",
        color: "bg-gray-50",
      })),
    ];

    fields.forEach((field) => {
      columns.push({
        data: field.key,
        type: "numeric",
        width: isMobile ? Math.max(70, baseWidth - 20) : baseWidth,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value || 0;
          td.style.textAlign = "right";
          td.style.padding = isMobile ? "4px 6px" : "8px 12px";
          td.style.fontSize = isMobile ? "12px" : "14px";
          td.className = `htNumeric ${field.color} hover:bg-opacity-80 transition-colors`;
        },
      });
    });

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

    if (isMobile) {
      return [
        "Attend",
        "SBS",
        "Visitors",
        "Tithes",
        "Offerings",
        "Special",
        ...customColumns.map((col) => col.name.split(" ")[0]),
        "Total",
      ];
    }

    return [
      "Attendance",
      "SBS Attendance",
      "Visitors",
      "Tithes (₦)",
      "Offerings (₦)",
      "Special Offerings (₦)",
      ...customColumns.map((col) => col.name + " (₦)"),
      "Total (₦)",
    ];
  }, [screens, customColumns]);

  const fetchInitialRecords = useCallback(async () => {
    if (!assembly) {
      setData(initializeEmptyData());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const month = format(selectedDate, "MMMM-yyyy");
      const response = await fetch(
        `/api/sunday-service-reports?assembly=${encodeURIComponent(assembly)}&month=${encodeURIComponent(month)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const { records } = await response.json();
      const filledData: SundayServiceRow[] = monthSundays.map((sunday, index) => {
        const record = records.find((r: SundayServiceRecord) => r.date === format(sunday, "yyyy-MM-dd"));
        return record
          ? {
              attendance: record.attendance || 0,
              sbsAttendance: record.sbsAttendance || 0,
              visitors: record.visitors || 0,
              tithes: record.tithes || 0,
              offerings: record.offerings || 0,
              specialOfferings: record.specialOfferings || 0,
              etf: record.etf || 0,
              pastorsWarfare: record.pastorsWarfare || 0,
              vigil: record.vigil || 0,
              thanksgiving: record.thanksgiving || 0,
              retirees: record.retirees || 0,
              missionaries: record.missionaries || 0,
              youthOfferings: record.youthOfferings || 0,
              districtSupport: record.districtSupport || 0,
              total: record.total || 0,
            }
          : {
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
            };
      });
      setData(filledData);
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
  }, [assembly, selectedDate, initializeEmptyData, monthSundays]);

  useEffect(() => {
    fetchInitialRecords();
  }, [fetchInitialRecords]);

  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (changes && source !== "loadData") {
        setData((prevData) => {
          const newData = [...prevData];
          changes.forEach(([row, prop, , newValue]) => {
            newData[row] = { ...newData[row], [prop as string]: Number(newValue) || 0 };
            const rowData = newData[row];
            // Exclude attendance fields from total
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

  const summaryStats = useMemo(() => {
    const stats = {
      totalAttendance: 0,
      totalSBSAttendance: 0,
      totalVisitors: 0,
      totalTithes: 0,
      totalOfferings: 0,
    };
    data.forEach((row) => {
      stats.totalAttendance += row.attendance || 0;
      stats.totalSBSAttendance += row.sbsAttendance || 0;
      stats.totalVisitors += row.visitors || 0;
      stats.totalTithes += row.tithes || 0;
      stats.totalOfferings +=
        (row.offerings || 0) +
        (row.specialOfferings || 0) +
        (row.etf || 0) +
        (row.pastorsWarfare || 0) +
        (row.vigil || 0) +
        (row.thanksgiving || 0) +
        (row.retirees || 0) +
        (row.missionaries || 0) +
        (row.youthOfferings || 0) +
        (row.districtSupport || 0);
    });
    return stats;
  }, [data]);

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

      const filledData: SundayServiceRecord[] = data
        .map((row, index) => ({
          week: `Week ${index + 1}`,
          date: format(monthSundays[index], "yyyy-MM-dd"),
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
            r.districtSupport > 0 ||
            r.attendance > 0 ||
            r.sbsAttendance > 0 ||
            r.visitors > 0
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
          month: format(selectedDate, "MMMM-yyyy"),
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

  const handleClear = () => {
    Modal.confirm({
      title: "Reset Sheet",
      content: "This will reset the sheet to empty records. Are you sure?",
      okText: "Yes, Reset",
      cancelText: "Cancel",
      okButtonProps: { danger: true, className: "bg-red-600 text-white rounded-lg" },
      onOk: () => setData(initializeEmptyData()),
    });
  };

  const handleExport = () => {
    const headers = ["Week", "Date", ...colHeaders];
    const csvData = [
      headers.join(","),
      ...data.map((row, index) => {
        const rowData: (string | number)[] = [
          `Week ${index + 1}`,
          format(monthSundays[index], "yyyy-MM-dd"),
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
    link.setAttribute("download", `SundayServiceReport-${format(selectedDate, "MMMM-yyyy")}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMonthChange = (date: moment.Moment | null) => {
    if (date) {
      setSelectedDate(date.toDate());
    }
  };

  const tableHeight = useMemo(() => {
    if (!screens.md) return 300;
    if (!screens.lg) return 350;
    return 400;
  }, [screens]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
      <div className="flex flex-col gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
          </div>

          <DatePicker.MonthPicker
            value={moment(selectedDate)}
            onChange={handleMonthChange}
            placeholder="Select month"
            className="rounded-lg w-full sm:w-auto"
            size={screens.xs ? "small" : "middle"}
            allowClear={false}
          />
        </div>

        <Row gutter={[12, 12]}>
          <Col xs={12} sm={12} lg={6}>
            <Card
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <Statistic
                title={
                  <span className="text-blue-100 text-sm flex items-center gap-2">
                    <UsergroupAddOutlined />
                    Total Attendance
                  </span>
                }
                value={summaryStats.totalAttendance}
                valueStyle={{ color: "#fff", fontSize: screens.xs ? "20px" : "24px" }}
                className="text-white"
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card
              className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <Statistic
                title={
                  <span className="text-green-100 text-sm flex items-center gap-2">
                    <TeamOutlined />
                    SBS Attendance
                  </span>
                }
                value={summaryStats.totalSBSAttendance}
                valueStyle={{ color: "#fff", fontSize: screens.xs ? "20px" : "24px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <Statistic
                title={
                  <span className="text-yellow-100 text-sm flex items-center gap-2">
                    <UserOutlined />
                    Total Visitors
                  </span>
                }
                value={summaryStats.totalVisitors}
                valueStyle={{ color: "#fff", fontSize: screens.xs ? "20px" : "24px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <Statistic
                title={
                  <span className="text-purple-100 text-sm flex items-center gap-2">
                    <DollarOutlined />
                    Total Tithes
                  </span>
                }
                value={summaryStats.totalTithes}
                prefix="₦"
                precision={0}
                valueStyle={{ color: "#fff", fontSize: screens.xs ? "20px" : "24px" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} lg={6}>
            <Card
              className="bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-xl shadow-md h-full border-0"
              bodyStyle={{ padding: screens.xs ? "16px 12px" : "20px" }}
            >
              <Statistic
                title={
                  <span className="text-pink-100 text-sm flex items-center gap-2">
                    <GiftOutlined />
                    Total Offerings
                  </span>
                }
                value={summaryStats.totalOfferings}
                prefix="₦"
                precision={0}
                valueStyle={{ color: "#fff", fontSize: screens.xs ? "20px" : "24px" }}
              />
            </Card>
          </Col>
        </Row>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
        <div className="text-sm text-gray-500">
          {screens.md && "Click on cells to edit values. Totals are calculated automatically."}
        </div>
        <Space
          wrap
          size={[8, 8]}
          className={`flex ${screens.xs ? "justify-stretch" : "justify-end"} flex-wrap gap-2`}
        >
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExport}
            size={screens.xs ? "small" : "middle"}
            className="bg-green-600 text-white hover:bg-green-700 rounded-lg flex items-center gap-1"
            block={screens.xs}
          >
            {screens.sm && "Export"}
          </Button>
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
              size={screens.xs ? "small" : "middle"}
              className="bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center gap-1"
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
            className="bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1"
            block={screens.xs}
          >
            {screens.sm && "Save"}
          </Button>
        </Space>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
            <Spin size="large" tip="Loading data..." />
          </div>
        )}
        <div
          className="handsontable-container border rounded-lg shadow-sm bg-white overflow-hidden"
          style={{
            height: tableHeight,
            fontSize: screens.xs ? "12px" : "14px",
          }}
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

      <Modal
        title={
          <div className="flex items-center gap-2">
            <UserOutlined className="text-blue-600" />
            <span>Confirm Save</span>
          </div>
        }
        open={isModalOpen}
        onOk={confirmSave}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setSubmittedBy("");
        }}
        okText="Save Report"
        cancelText="Cancel"
        okButtonProps={{
          type: "primary",
          loading,
          className: "bg-blue-600 hover:bg-blue-700 rounded-lg h-10",
        }}
        cancelButtonProps={{ className: "rounded-lg h-10" }}
        width={screens.xs ? 350 : 500}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to save this month's Sunday Service Report? Only filled rows will be saved.
          </p>
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
                className="rounded-lg h-10"
                prefix={<UserOutlined className="text-gray-400" />}
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <style jsx global>{`
        .custom-handsontable .htCore {
          font-size: ${screens.xs ? "12px" : "14px"};
        }
        .custom-handsontable th {
          font-weight: 600;
          background-color: #f8fafc;
          padding: ${screens.xs ? "6px 8px" : "8px 12px"};
          white-space: ${screens.xs ? "normal" : "nowrap"};
        }
        .custom-handsontable td {
          transition: background-color 0.2s;
        }
        .custom-handsontable td:hover {
          background-color: #f1f5f9 !important;
        }
      `}</style>
    </div>
  );
};

export default DistrictSundayServiceReport;