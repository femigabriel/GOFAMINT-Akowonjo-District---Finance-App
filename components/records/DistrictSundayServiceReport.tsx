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
  Tooltip,
  Input,
  Form,
  Card,
  Row,
  Col,
  Popconfirm,
  DatePicker,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  PlusOutlined,
  DeleteOutlined,
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
  total: number;
  [key: string]: number; // Allow any string key for custom columns
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
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (!isSameMonth(now, selectedDate)) {
        setSelectedDate(now);
      }
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const getMonthDates = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const sundays = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 });
    console.log("Sundays in month:", sundays.map((d) => format(d, "d/M")));
    return sundays.slice(0, 5);
  }, []);

  const monthDates = useMemo(() => getMonthDates(selectedDate), [selectedDate, getMonthDates]);

  const rowHeaders = useMemo(() => {
    return monthDates.map((date, i) => `Week ${i + 1} (${format(date, "d/M")})`);
  }, [monthDates]);

  const initializeEmptyData = useCallback(() => {
    return Array.from({ length: monthDates.length }, () => ({
      attendance: 0,
      sbsAttendance: 0,
      visitors: 0,
      tithes: 0,
      offerings: 0,
      specialOfferings: 0,
      total: 0,
      ...customColumns.reduce((acc, col) => ({ ...acc, [col.key]: 0 }), {}),
    }));
  }, [customColumns, monthDates]);

  const getColumns = useCallback(() => {
    const columns: any[] = [];
    const fields = [
      { key: "attendance", title: "Attendance", color: "bg-blue-50" },
      { key: "sbsAttendance", title: "SBS Attendance", color: "bg-green-50" },
      { key: "visitors", title: "Visitors", color: "bg-yellow-50" },
      { key: "tithes", title: "Tithes (₦)", color: "bg-purple-50" },
      { key: "offerings", title: "Offerings (₦)", color: "bg-pink-50" },
      { key: "specialOfferings", title: "Special Offerings (₦)", color: "bg-indigo-50" },
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

    customColumns.forEach((col) => {
      columns.push({
        data: col.key,
        type: "numeric",
        width: 120,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value || 0;
          td.style.textAlign = "right";
          td.className = "htNumeric bg-gray-50";
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
  }, [customColumns]);

  const colHeaders = useMemo(() => {
    const headers = ["Attendance", "SBS Attendance", "Visitors", "Tithes (₦)", "Offerings (₦)", "Special Offerings (₦)"];
    customColumns.forEach((col) => headers.push(col.name));
    headers.push("Total (₦)");
    return headers;
  }, [customColumns]);

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
      const filledData = [...records];
      while (filledData.length < monthDates.length) {
        filledData.push({
          attendance: 0,
          sbsAttendance: 0,
          visitors: 0,
          tithes: 0,
          offerings: 0,
          specialOfferings: 0,
          total: 0,
          ...customColumns.reduce((acc, col) => ({ ...acc, [col.key]: 0 }), {}),
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

  useEffect(() => {
    console.log("monthDates length:", monthDates.length);
    console.log("data length:", data.length);
    console.log("rowHeaders:", rowHeaders);
  }, [monthDates, data, rowHeaders]);

  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (changes && source !== "loadData") {
        setData((prevData) => {
          const newData = [...prevData];
          changes.forEach(([row, prop, , newValue]) => {
            const key = prop as keyof SundayServiceRow;
            newData[row] = { ...newData[row], [key]: Number(newValue) || 0 };
            const rowData = newData[row];
            newData[row].total = (rowData.tithes || 0) + (rowData.offerings || 0) + (rowData.specialOfferings || 0);
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
      totalSpecialOfferings: 0,
      grandTotal: 0,
    };
    data.forEach((row) => {
      stats.totalAttendance += row.attendance || 0;
      stats.totalSBSAttendance += row.sbsAttendance || 0;
      stats.totalVisitors += row.visitors || 0;
      stats.totalTithes += row.tithes || 0;
      stats.totalOfferings += row.offerings || 0;
      stats.totalSpecialOfferings += row.specialOfferings || 0;
      stats.grandTotal += row.total || 0;
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
      const filledData = data
        .map((row, index) => ({
          week: `Week ${index + 1}`,
          attendance: row.attendance,
          sbsAttendance: row.sbsAttendance,
          visitors: row.visitors,
          tithes: row.tithes,
          offerings: row.offerings,
          specialOfferings: row.specialOfferings,
          total: row.total,
          ...customColumns.reduce((acc, col) => ({ ...acc, [col.key]: row[col.key] || 0 }), {}),
        }))
        .filter(
          (r) =>
            r.attendance > 0 ||
            r.sbsAttendance > 0 ||
            r.visitors > 0 ||
            r.tithes > 0 ||
            r.offerings > 0 ||
            r.specialOfferings > 0 ||
            customColumns.some((col) => Number(r[col.key] ?? 0) > 0)
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
          ...customColumns.map((col) => row[col.key] || 0),
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
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      notification.error({
        message: "Error",
        description: "Please enter a column name.",
      });
      return;
    }
    const newKey = `custom${customColumns.length + 1}`;
    setCustomColumns([...customColumns, { name: newColumnName.trim(), key: newKey }]);
    setData((prevData) =>
      prevData.map((row) => ({ ...row, [newKey]: 0 }))
    );
    setNewColumnName("");
    notification.success({
      message: "Column Added",
      description: `Custom column "${newColumnName.trim()}" added successfully.`,
    });
  };

  const handleRemoveColumn = (key: string) => {
    setCustomColumns(customColumns.filter((col) => col.key !== key));
    setData((prevData) =>
      prevData.map((row) => {
        const { [key]: _, ...rest } = row;
        return {
          ...rest,
          total: (rest.tithes || 0) + (rest.offerings || 0) + (rest.specialOfferings || 0),
        } as SundayServiceRow;
      })
    );
    notification.success({
      message: "Column Removed",
      description: "Custom column removed successfully.",
    });
  };

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
        </Row>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Input
            placeholder="Enter custom column name (e.g., Missions)"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            className="w-full sm:w-64 rounded-lg"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddColumn}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Add Column
          </Button>
        </div>
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

      {customColumns.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Custom Columns</h4>
          <Space wrap>
            {customColumns.map((col) => (
              <div key={col.key} className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                <span>{col.name}</span>
                <Popconfirm
                  title={`Remove column "${col.name}"?`}
                  description="This will delete the column and its data."
                  onConfirm={() => handleRemoveColumn(col.key)}
                  okText="Yes"
                  cancelText="No"
                  okButtonProps={{ danger: true, className: "bg-red-600 text-white rounded-lg" }}
                >
                  <Button
                    icon={<DeleteOutlined />}
                    size="small"
                    danger
                    className="rounded-lg"
                  />
                </Popconfirm>
              </div>
            ))}
          </Space>
        </div>
      )}

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