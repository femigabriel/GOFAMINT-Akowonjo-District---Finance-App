"use client";

import { useRef, useState, useCallback, useMemo } from "react";
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
  Popconfirm,
} from "antd";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import moment from "moment";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  PlusOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

// ✅ Register all Handsontable cell types
import { registerAllCellTypes } from "handsontable/cellTypes";
registerAllCellTypes();

import type { CellChange, ChangeSource } from "handsontable/common";

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

  // Get all Sundays of month
  const getSundays = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const sundays = eachWeekOfInterval({ start, end }, { weekStartsOn: 0 }).filter(
      (date) => date >= start && date <= end
    );
    return sundays.map((sunday) => format(sunday, "d/M"));
  }, []);

  const sundays = useMemo(() => getSundays(selectedDate), [selectedDate, getSundays]);

  // Build headers
  const colHeaders = useMemo(
    () => [
      "Full Name",
      "Tithe Number",
      ...sundays.map((date, i) => `Week ${i + 1} (${date})`),
      "Total",
    ],
    [sundays]
  );

  // Initialize data (250 rows)
  const initializeData = useCallback(() => {
    return Array.from({ length: 250 }, () => ({
      name: "",
      titheNumber: "",
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
      ...(sundays.length === 5 ? { week5: 0 } : {}),
      total: 0,
    }));
  }, [sundays]);

  // Initialize on mount
  useState(() => setData(initializeData()));

  // Handle changes (calculate totals)
  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (changes && source !== "loadData") {
        const newData = [...data];

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

        setData(newData);
      }
    },
    [data, sundays]
  );

  // Total sum of all records
  const grandTotal = useMemo(
    () => data.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
    [data]
  );

  // Save confirmation modal
  const handleSave = () => setIsModalOpen(true);

  const confirmSave = async () => {
    const filledData = data.filter(
      (r) =>
        r.name?.trim() !== "" ||
        r.titheNumber?.trim() !== "" ||
        r.week1 > 0 ||
        r.week2 > 0 ||
        r.week3 > 0 ||
        r.week4 > 0 ||
        (r.week5 ?? 0) > 0
    );

    console.log("Saving only filled data:", filledData);

    setIsModalOpen(false);
    notification.success({
      message: "Data Saved Successfully",
      description: `${filledData.length} record(s) saved.`,
      placement: "topRight",
    });
  };

  // Toolbar actions
  const handleAddRows = () => {
    setData([...data, ...Array.from({ length: 50 }, () => initializeData()[0])]);
  };

  const handleClear = () => {
    Modal.confirm({
      title: "Clear All Data",
      content: "This will remove all entries. Are you sure?",
      okText: "Yes, Clear",
      cancelText: "Cancel",
      okButtonProps: { danger: true },
      onOk: () => setData(initializeData()),
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
    <div className="container mx-auto p-6 bg-gray-50 rounded-t-md min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CalendarOutlined /> Tithe Management Sheet
        </h2>

        <Space wrap>
          <DatePicker.MonthPicker
            value={moment(selectedDate)}
            onChange={(date) => date && setSelectedDate(date.toDate())}
            format="MMMM YYYY"
          />
          <Tooltip title="Add more rows">
            <Button icon={<PlusOutlined />} onClick={handleAddRows}>
              Add Rows
            </Button>
          </Tooltip>
          <Tooltip title="Export to Excel">
            <Button icon={<FileExcelOutlined />} onClick={handleExport}>
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Clear all data">
            <Button icon={<ReloadOutlined />} danger onClick={handleClear}>
              Clear
            </Button>
          </Tooltip>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            Save Data
          </Button>
        </Space>
      </div>

      {/* Summary Bar */}
      <div className="bg-white border rounded-lg shadow-sm mb-4 p-4 flex justify-between items-center">
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

      {/* Handsontable */}
      <div
        className="handsontable-container border rounded-lg shadow-sm bg-white"
        style={{ height: "calc(100vh - 260px)", overflow: "auto" }}
      >
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={colHeaders}
          columns={[
            { data: "name", type: "text", width: 300 },
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
          minSpareRows={10}
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
        onCancel={() => setIsModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ type: "primary" }}
      >
        <p>Are you sure you want to save this month’s tithe data? Only filled rows will be saved.</p>
      </Modal>
    </div>
  );
};

export default AddTitheSheet;
