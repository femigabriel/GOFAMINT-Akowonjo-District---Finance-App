// components/AddOfferingSheet.tsx
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
  Select,
  InputRef,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import moment from "moment";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useAuth } from "@/context/AuthContext";

registerAllCellTypes();

interface OfferingRow {
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5?: number;
  tuesdayWeek1: number;
  tuesdayWeek2: number;
  tuesdayWeek3: number;
  tuesdayWeek4: number;
  tuesdayWeek5?: number;
  thursdayWeek1: number;
  thursdayWeek2: number;
  thursdayWeek3: number;
  thursdayWeek4: number;
  thursdayWeek5?: number;
  amount: number;
  total: number;
}

interface AddOfferingSheetProps {
  type: "Sunday Service" | "Tuesday Bible Study and Thursday Prayer Meeting" | "Special";
  specialOfferingType?: string;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const predefinedSpecialOfferings = [
  "Pastor's Welfare",
  "Thanksgiving",
  "Missionaries",
  "Retirees",
  "Youth Offerings",
  "District Support",
  "ETF",
  "Special Offerings",
  "Vigil",
];

const AddOfferingSheet: React.FC<AddOfferingSheetProps> = ({ type, specialOfferingType: initialSpecialOfferingType, selectedDate, onDateChange }) => {
  const hotRef = useRef<HotTableClass>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<OfferingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState<string>("");
  const { assembly } = useAuth();
  const [form] = Form.useForm();
  const [specialOfferingType, setSpecialOfferingType] = useState<string | null>(initialSpecialOfferingType || null);
  const [customOfferingType, setCustomOfferingType] = useState<string>("");
  const customInputRef = useRef<InputRef>(null);

  const getMonthDates = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const sundays = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).filter(
      (date) => date >= start && date <= end
    );
    const tuesdays = eachWeekOfInterval({ start, end }, { weekStartsOn: 2 }).filter(
      (date) => date >= start && date <= end
    );
    const thursdays = eachWeekOfInterval({ start, end }, { weekStartsOn: 4 }).filter(
      (date) => date >= start && date <= end
    );
    return { sundays, tuesdays, thursdays };
  }, []);

  const monthDates = useMemo(() => getMonthDates(selectedDate), [selectedDate, getMonthDates]);

  const getColumns = useCallback(() => {
    const columns: any[] = [];
    if (type === "Sunday Service") {
      monthDates.sundays.forEach((date, i) => {
        columns.push({
          data: `week${i + 1}`,
          type: "numeric",
          width: 120,
          renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
            td.innerHTML = value || 0;
            td.style.textAlign = "right";
            td.className = "bg-blue-50";
          },
        });
      });
      columns.push({
        data: "amount",
        type: "numeric",
        readOnly: true,
        width: 120,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value || 0;
          td.style.textAlign = "right";
          td.className = "bg-gray-100 font-semibold";
        },
      });
    } else if (type === "Tuesday Bible Study and Thursday Prayer Meeting") {
      monthDates.tuesdays.forEach((date, i) => {
        columns.push({
          data: `tuesdayWeek${i + 1}`,
          type: "numeric",
          width: 120,
          renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
            td.innerHTML = value || 0;
            td.style.textAlign = "right";
            td.className = "bg-green-50";
          },
        });
      });
      monthDates.thursdays.forEach((date, i) => {
        columns.push({
          data: `thursdayWeek${i + 1}`,
          type: "numeric",
          width: 120,
          renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
            td.innerHTML = value || 0;
            td.style.textAlign = "right";
            td.className = "bg-yellow-50";
          },
        });
      });
      columns.push({
        data: "amount",
        type: "numeric",
        readOnly: true,
        width: 120,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value || 0;
          td.style.textAlign = "right";
          td.className = "bg-gray-100 font-semibold";
        },
      });
    } else if (type === "Special" && specialOfferingType) {
      columns.push({
        data: "amount",
        type: "numeric",
        width: 120,
        renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
          td.innerHTML = value || 0;
          td.style.textAlign = "right";
          td.className = "bg-purple-50";
        },
      });
    }

    columns.push({
      data: "total",
      type: "numeric",
      readOnly: true,
      width: 120,
      renderer: (instance: any, td: any, row: number, col: number, prop: string, value: any) => {
        td.innerHTML = value || 0;
        td.style.textAlign = "right";
        td.className = "bg-gray-200 font-semibold";
      },
    });

    return columns;
  }, [monthDates, type, specialOfferingType]);

  const colHeaders = useMemo(() => {
    const headers: string[] = [];
    if (type === "Sunday Service") {
      monthDates.sundays.forEach((date, i) => {
        headers.push(`Week ${i + 1} (${format(date, "d/M")})`);
      });
      headers.push("Amount");
    } else if (type === "Tuesday Bible Study and Thursday Prayer Meeting") {
      monthDates.tuesdays.forEach((date, i) => {
        headers.push(`Tuesday Week ${i + 1} (${format(date, "d/M")})`);
      });
      monthDates.thursdays.forEach((date, i) => {
        headers.push(`Thursday Week ${i + 1} (${format(date, "d/M")})`);
      });
      headers.push("Amount");
    } else if (type === "Special" && specialOfferingType) {
      headers.push(specialOfferingType);
    }
    headers.push("Total");
    return headers;
  }, [monthDates, type, specialOfferingType]);

  const initializeEmptyData = useCallback(
    () =>
      Array.from({ length: 5 }, () => ({
        week1: 0,
        week2: 0,
        week3: 0,
        week4: 0,
        week5: 0,
        tuesdayWeek1: 0,
        tuesdayWeek2: 0,
        tuesdayWeek3: 0,
        tuesdayWeek4: 0,
        tuesdayWeek5: 0,
        thursdayWeek1: 0,
        thursdayWeek2: 0,
        thursdayWeek3: 0,
        thursdayWeek4: 0,
        thursdayWeek5: 0,
        amount: 0,
        total: 0,
      })),
    []
  );

  const fetchInitialRecords = useCallback(async () => {
    if (!assembly) {
      setData(initializeEmptyData());
      setLoading(false);
      return;
    }
    if (type === "Special" && !specialOfferingType) {
      setData(initializeEmptyData());
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const effectiveType = type === "Special" ? specialOfferingType || type : type;
      const month = moment(selectedDate).format("MMMM-YYYY");
      const response = await fetch(
        `/api/offerings?assembly=${encodeURIComponent(assembly)}&type=${encodeURIComponent(effectiveType)}&month=${encodeURIComponent(month)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      const { records } = await response.json();
      console.log('Fetched initial records:', records.length);
      const filledData = records.slice(0, 5);
      const remainingRows = 5 - filledData.length;
      if (remainingRows > 0) {
        filledData.push(...initializeEmptyData().slice(0, remainingRows));
      }
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
  }, [assembly, type, specialOfferingType, selectedDate, initializeEmptyData]);

  useEffect(() => {
    fetchInitialRecords();
  }, [selectedDate, type, specialOfferingType, fetchInitialRecords]);

 const afterChange = useCallback(
  (changes: CellChange[] | null, source: ChangeSource) => {
    if (changes && source !== "loadData") {
      setData((prevData) => {
        const newData = [...prevData];
        changes.forEach(([row, prop, , newValue]) => {
          // Cast prop to keyof OfferingRow to satisfy TypeScript
          const key = prop as keyof OfferingRow;
          newData[row] = { ...newData[row], [key]: Number(newValue) || 0 };
          const {
            week1 = 0,
            week2 = 0,
            week3 = 0,
            week4 = 0,
            week5 = 0,
            tuesdayWeek1 = 0,
            tuesdayWeek2 = 0,
            tuesdayWeek3 = 0,
            tuesdayWeek4 = 0,
            tuesdayWeek5 = 0,
            thursdayWeek1 = 0,
            thursdayWeek2 = 0,
            thursdayWeek3 = 0,
            thursdayWeek4 = 0,
            thursdayWeek5 = 0,
            amount = 0,
          } = newData[row];
          if (type === "Sunday Service") {
            newData[row].amount =
              week1 + week2 + week3 + week4 + (monthDates.sundays.length === 5 ? week5 : 0);
          } else if (type === "Tuesday Bible Study and Thursday Prayer Meeting") {
            newData[row].amount =
              tuesdayWeek1 + tuesdayWeek2 + tuesdayWeek3 + tuesdayWeek4 +
              (monthDates.tuesdays.length === 5 ? tuesdayWeek5 : 0) +
              thursdayWeek1 + thursdayWeek2 + thursdayWeek3 + thursdayWeek4 +
              (monthDates.thursdays.length === 5 ? thursdayWeek5 : 0);
          } else {
            newData[row].amount = amount;
          }
          newData[row].total = newData[row].amount;
        });
        return newData;
      });
    }
  },
  [type, monthDates]
);

  const grandTotal = useMemo(
    () => data.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [data]
  );

  const handleSave = () => {
    if (!assembly) {
      notification.error({
        message: "Error",
        description: "No assembly selected. Please log in again.",
      });
      return;
    }
    if (type === "Special" && !specialOfferingType) {
      notification.error({
        message: "Error",
        description: "Please select or enter a special offering type.",
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
          (type === "Sunday Service" &&
            (r.week1 > 0 || r.week2 > 0 || r.week3 > 0 || r.week4 > 0 || (r.week5 ?? 0) > 0)) ||
          (type === "Tuesday Bible Study and Thursday Prayer Meeting" &&
            (r.tuesdayWeek1 > 0 || r.tuesdayWeek2 > 0 || r.tuesdayWeek3 > 0 || r.tuesdayWeek4 > 0 ||
             (r.tuesdayWeek5 ?? 0) > 0 || r.thursdayWeek1 > 0 || r.thursdayWeek2 > 0 ||
             r.thursdayWeek3 > 0 || r.thursdayWeek4 > 0 || (r.thursdayWeek5 ?? 0) > 0)) ||
          (type === "Special" && r.amount > 0)
      );

      if (filledData.length === 0) {
        notification.error({
          message: "Error",
          description: "No valid records to save.",
        });
        return;
      }

      setLoading(true);
      const effectiveType = type === "Special" ? specialOfferingType : type;
      const response = await fetch("/api/offerings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assembly,
          submittedBy,
          month: moment(selectedDate).format("MMMM-YYYY"),
          type: effectiveType,
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
      okButtonProps: { danger: true, className: "bg-red-600 text-white rounded-md" },
      onOk: () => fetchInitialRecords(),
    });
  };

  const handleExport = () => {
    const headers = colHeaders;
    const csvData = [
      headers.join(","),
      ...data.map((r) => {
        const rowData: (string | number)[] = [];
        if (type === "Sunday Service") {
          monthDates.sundays.forEach((_, i) => {
            rowData.push(r[`week${i + 1}` as keyof OfferingRow] || 0);
          });
          rowData.push(r.amount);
        } else if (type === "Tuesday Bible Study and Thursday Prayer Meeting") {
          monthDates.tuesdays.forEach((_, i) => {
            rowData.push(r[`tuesdayWeek${i + 1}` as keyof OfferingRow] || 0);
          });
          monthDates.thursdays.forEach((_, i) => {
            rowData.push(r[`thursdayWeek${i + 1}` as keyof OfferingRow] || 0);
          });
          rowData.push(r.amount);
        } else if (type === "Special") {
          rowData.push(r.amount || 0);
        }
        rowData.push(r.total);
        return rowData.join(",");
      }),
    ].join("\n");

    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Offerings-${type}-${moment(selectedDate).format("MMMM-YYYY")}.csv`);
    link.click();
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mb-6">
      <div className="flex flex-col gap-4 mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <CalendarOutlined className="text-blue-600" /> {type === "Special" ? specialOfferingType || "Special Offerings" : type}
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {type === "Special" && (
            <Select
              placeholder="Select Special Offering Type"
              allowClear
              value={specialOfferingType}
              onChange={(value) => {
                setSpecialOfferingType(value || null);
                setCustomOfferingType("");
              }}
              className="w-full sm:w-48"
              dropdownRender={(menu) => (
                <>
                  {menu}
                  <div className="p-2">
                    <Input
                      ref={customInputRef}
                      placeholder="Enter custom offering type"
                      value={customOfferingType}
                      onChange={(e) => setCustomOfferingType(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customOfferingType.trim()) {
                          setSpecialOfferingType(customOfferingType.trim());
                          setCustomOfferingType("");
                          customInputRef.current?.blur();
                        }
                      }}
                      className="rounded-md"
                    />
                  </div>
                </>
              )}
            >
              {predefinedSpecialOfferings.map((type) => (
                <Select.Option key={type} value={type}>
                  {type}
                </Select.Option>
              ))}
            </Select>
          )}
          <Space wrap size={[8, 8]} className="flex justify-end flex-wrap gap-2">
            <Tooltip title="Export to Excel">
              <Button
                icon={<FileExcelOutlined />}
                onClick={handleExport}
                className="bg-green-600 text-white hover:bg-green-700 rounded-md"
              >
                Export
              </Button>
            </Tooltip>
            <Tooltip title="Reset to empty records">
              <Button
                icon={<ReloadOutlined />}
                onClick={handleClear}
                className="bg-red-600 text-white hover:bg-red-700 rounded-md"
              >
                Reset
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
              className="bg-blue-600 hover:bg-blue-700 rounded-md"
              disabled={type === "Special" && !specialOfferingType}
            >
              Save
            </Button>
          </Space>
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm mb-4 p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <Statistic
          title="Total Amount"
          value={grandTotal}
          prefix="₦"
          precision={2}
          valueStyle={{ color: "#3b82f6" }}
        />
        <span className="text-sm text-gray-500">
          Showing {data.length} rows — {moment(selectedDate).format("MMMM YYYY")}
        </span>
      </div>

      <div
        className="handsontable-container border rounded-lg shadow-sm bg-white"
        style={{ height: "300px", overflow: "auto" }}
      >
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={colHeaders}
          columns={getColumns()}
          afterChange={afterChange}
          stretchH="all"
          autoRowSize={false}
          autoColumnSize={false}
          minSpareRows={0}
          rowHeaders={true}
          contextMenu={true}
          licenseKey="non-commercial-and-evaluation"
          className="text-sm font-medium"
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
        okButtonProps={{ type: "primary", loading, className: "bg-blue-600 rounded-md" }}
        cancelButtonProps={{ className: "rounded-md" }}
      >
        <p>Are you sure you want to save this month’s {type === "Special" ? specialOfferingType || "Special" : type} offering data? Only filled rows will be saved.</p>
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
              className="rounded-md"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddOfferingSheet;