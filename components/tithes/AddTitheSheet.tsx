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
  Input,
  Form,
  Card,
  Row,
  Col,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  FileExcelOutlined,
  CalendarOutlined,
  RollbackOutlined,
  DatabaseOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { format, startOfMonth, endOfMonth, eachWeekOfInterval } from "date-fns";
import moment from "moment";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { titheData } from "@/lib/tithe-data";

registerAllCellTypes();

interface TitheRowInternal {
  _sn: number;
  name: string;
  titheNumber: string;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5?: number;
  total: number;
}

interface TitheRow extends Omit<TitheRowInternal, "_sn"> {}

interface DatabaseRecord {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: TitheRow[];
  createdAt: string;
  updatedAt?: string;
}

const AddTitheSheet = () => {
  const hotRef = useRef<HotTableClass>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [data, setData] = useState<TitheRowInternal[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedBy, setSubmittedBy] = useState<string>("");
  const { assembly } = useAuth();
  const [form] = Form.useForm();
  const [existingRecord, setExistingRecord] = useState<DatabaseRecord | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    totalTithe: 0,
    totalMembers: 0,
    averageTithe: 0,
    savedRecords: 0,
  });

  const getSundays = useCallback((date: Date) => {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    return eachWeekOfInterval({ start, end }, { weekStartsOn: 0 })
      .filter((d) => d >= start && d <= end)
      .map((sunday) => format(sunday, "d/M"));
  }, []);

  const sundays = useMemo(
    () => getSundays(selectedDate),
    [selectedDate, getSundays]
  );

  const colHeaders = useMemo(
    () => [
      "Full Name",
      "Tithe Number",
      ...sundays.map((date, i) => `Week ${i + 1} (${date})`),
      "Total",
    ],
    [sundays]
  );

  const initializeEmptyData = useCallback(() => {
    const base = {
      _sn: 0,
      name: "",
      titheNumber: "",
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
      total: 0,
    } as TitheRowInternal;

    if (sundays.length === 5) {
      base.week5 = 0;
    }

    return Array.from({ length: 200 }, () => ({ ...base }));
  }, [sundays]);

  const getTitherListFromData = useCallback(() => {
    if (!assembly) return [];

    const assemblyData = titheData.find(
      (item) => item.assembly.toUpperCase() === assembly.toUpperCase()
    );

    if (!assemblyData) {
      notification.warning({
        message: "No Data Found",
        description: `No member list found for ${assembly} assembly`,
      });
      return [];
    }

    return assemblyData.members.map((member) => ({
      _sn: member.sn,
      name: member.name,
      titheNumber: String(member.sn).padStart(3, "0"),
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
      ...(sundays.length === 5 ? { week5: 0 } : {}),
      total: 0,
    }));
  }, [assembly, sundays]);

  // Load saved data from database
  const loadSavedData = useCallback(async () => {
    if (!assembly) return null;

    try {
      setLoading(true);
      const monthStr = moment(selectedDate).format("MMMM-YYYY");
      const response = await fetch(
        `/api/tithes?assembly=${encodeURIComponent(assembly)}&month=${monthStr}`
      );

      const result = await response.json();

      if (result.success && result.data.length > 0) {
        const savedRecord = result.data[0];
        setExistingRecord(savedRecord);
        setSubmittedBy(savedRecord.submittedBy);
        setIsEditing(true);

        // Convert saved records to internal format
        const savedRecords: TitheRowInternal[] = savedRecord.records.map(
          (record: any, index: number) => ({
            _sn: index + 1,
            name: record.name || "",
            titheNumber: record.titheNumber || "",
            week1: Number(record.week1) || 0,
            week2: Number(record.week2) || 0,
            week3: Number(record.week3) || 0,
            week4: Number(record.week4) || 0,
            week5: Number(record.week5) || 0,
            total: Number(record.total) || 0,
          })
        );

        // Calculate stats from saved data
        const totalTithe = savedRecord.records.reduce(
          (sum: number, record: any) => sum + (Number(record.total) || 0),
          0
        );
        const totalMembers = savedRecord.records.length;
        const averageTithe = totalMembers > 0 ? totalTithe / totalMembers : 0;

        setStats({
          totalTithe,
          totalMembers,
          averageTithe,
          savedRecords: savedRecord.records.length,
        });

        // Fill remaining rows with empty data or member list
        const remainingRows = 200 - savedRecords.length;
        let filledData = [...savedRecords];

        if (remainingRows > 0) {
          // Check if we should add member list for empty rows
          const titherList = getTitherListFromData();
          if (titherList.length > 0) {
            // Filter out members already in saved data
            const existingNames = new Set(
              savedRecords.map((r) => r.name.toLowerCase())
            );
            const newMembers = titherList
              .filter((member) => !existingNames.has(member.name.toLowerCase()))
              .slice(0, remainingRows);

            filledData = [...filledData, ...newMembers];

            // Fill remaining with empty rows
            const stillRemaining = 200 - filledData.length;
            if (stillRemaining > 0) {
              filledData.push(
                ...initializeEmptyData().slice(0, stillRemaining)
              );
            }
          } else {
            filledData.push(...initializeEmptyData().slice(0, remainingRows));
          }
        }

        setData(filledData.slice(0, 200));

        notification.info({
          message: "Saved Data Loaded",
          description: `Loaded ${savedRecord.records.length} saved records for ${savedRecord.month}`,
        });

        return savedRecord;
      }

      // No saved data found, load member list
      return null;
    } catch (error) {
      console.error("Error loading saved data:", error);
      notification.error({
        message: "Error Loading Data",
        description: "Failed to load saved data from database",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [assembly, selectedDate, getTitherListFromData, initializeEmptyData]);

  // Load member list when no saved data exists
  const loadMemberList = useCallback(() => {
    if (!assembly) {
      setData(initializeEmptyData());
      setStats({
        totalTithe: 0,
        totalMembers: 0,
        averageTithe: 0,
        savedRecords: 0,
      });
      return;
    }

    setLoading(true);
    try {
      const titherList = getTitherListFromData();
      let filledData: TitheRowInternal[] =
        titherList.length > 0 ? [...titherList] : [];

      const remaining = 200 - filledData.length;
      if (remaining > 0) {
        filledData.push(...initializeEmptyData().slice(0, remaining));
      }

      if (titherList.length > 0) {
        notification.success({
          message: "Members Loaded",
          description: `Loaded ${titherList.length} members from ${assembly}`,
        });
      }

      setData(filledData.slice(0, 200));
      setStats({
        totalTithe: 0,
        totalMembers: titherList.length,
        averageTithe: 0,
        savedRecords: 0,
      });
    } catch (err) {
      notification.error({ message: "Error loading members" });
      setData(initializeEmptyData());
    } finally {
      setLoading(false);
    }
  }, [assembly, getTitherListFromData, initializeEmptyData]);

  // Main data loading effect
  useEffect(() => {
    if (!assembly) {
      setData(initializeEmptyData());
      setLoading(false);
      return;
    }

    const loadData = async () => {
      const savedData = await loadSavedData();
      if (!savedData) {
        // No saved data found, load member list
        loadMemberList();
      }
    };

    loadData();
  }, [
    assembly,
    selectedDate,
    loadSavedData,
    loadMemberList,
    initializeEmptyData,
  ]);

  // Fixed: Type-safe afterChange
  const afterChange = useCallback(
    (changes: CellChange[] | null, source: ChangeSource) => {
      if (!changes || source === "loadData") return;

      setData((prev) => {
        const newData = [...prev];

        for (const [row, prop, , newValue] of changes) {
          if (typeof prop !== "string") continue;

          if (
            prop === "name" ||
            prop === "titheNumber" ||
            prop.startsWith("week")
          ) {
            const numValue =
              newValue === null || newValue === "" ? 0 : Number(newValue);
            (newData[row] as any)[prop] = isNaN(numValue) ? 0 : numValue;
          }

          const r = newData[row];
          r.total =
            Number(r.week1 || 0) +
            Number(r.week2 || 0) +
            Number(r.week3 || 0) +
            Number(r.week4 || 0) +
            (sundays.length === 5 ? Number(r.week5 ?? 0) : 0);
        }

        // Update stats
        const grandTotal = newData.reduce(
          (sum, row) => sum + Number(row.total || 0),
          0
        );
        const activeMembers = newData.filter(
          (r) => r.name?.trim() && (r.total || 0) > 0
        ).length;
        const avgTithe = activeMembers > 0 ? grandTotal / activeMembers : 0;

        setStats((prev) => ({
          ...prev,
          totalTithe: grandTotal,
          totalMembers: newData.filter((r) => r.name?.trim()).length,
          averageTithe: avgTithe,
          savedRecords: existingRecord?.records.length || 0,
        }));

        return newData;
      });
    },
    [sundays.length, existingRecord]
  );

  const handleSave = () => {
    if (!assembly)
      return notification.error({ message: "No assembly selected" });
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    try {
      await form.validateFields();

      const filledData: TitheRow[] = data
        .filter((r) => r.name?.trim() && r.titheNumber?.trim())
        .map(({ _sn, ...rest }) => rest as TitheRow)
        .filter((r) => {
          return (
            r.week1 > 0 ||
            r.week2 > 0 ||
            r.week3 > 0 ||
            r.week4 > 0 ||
            (sundays.length === 5 && (r.week5 ?? 0) > 0)
          );
        });

      if (filledData.length === 0) {
        return notification.error({ message: "No valid records to save." });
      }

      setLoading(true);
      const res = await fetch("/api/tithes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assembly,
          submittedBy,
          month: moment(selectedDate).format("MMMM-YYYY"),
          records: filledData,
          ...(existingRecord && { id: existingRecord._id }),
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        notification.success({
          message: result.isUpdate
            ? "Updated successfully!"
            : "Saved successfully!",
        });
        setIsModalOpen(false);
        form.resetFields();
        setSubmittedBy("");
        setIsEditing(result.isUpdate);

        // Reload the saved data
        await loadSavedData();
      } else {
        throw new Error(result.error || "Save failed");
      }
    } catch (err: any) {
      notification.error({ message: "Save failed", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Modal.confirm({
      title: "Reset Sheet",
      content: "Reload all members from this assembly?",
      onOk: () => {
        const list = getTitherListFromData();
        const padded =
          list.length < 200
            ? [...list, ...initializeEmptyData().slice(0, 200 - list.length)]
            : list.slice(0, 200);
        setData(padded);
        setExistingRecord(null);
        setIsEditing(false);
        setStats({
          totalTithe: 0,
          totalMembers: list.length,
          averageTithe: 0,
          savedRecords: 0,
        });
      },
    });
  };

  const handleExport = () => {
    const rows = data.map((r) => [
      `"${r.name}"`,
      r.titheNumber,
      r.week1,
      r.week2,
      r.week3,
      r.week4,
      sundays.length === 5 ? r.week5 ?? "" : "",
      r.total,
    ]);

    const csv = [colHeaders.join(","), ...rows.map((r) => r.join(","))].join(
      "\n"
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Tithes-${assembly}-${moment(selectedDate).format(
      "MMMM-YYYY"
    )}.csv`;
    a.click();
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex justify-between items-start">
          <h2 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
            <CalendarOutlined /> Tithe Sheet - {assembly || "Loading..."}
          </h2>
          <Link href="/submissions">
            <Button>
              Back <RollbackOutlined />
            </Button>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <DatePicker.MonthPicker
            value={moment(selectedDate)}
            onChange={(d) => d && setSelectedDate(d.toDate())}
            format="MMMM YYYY"
          />
          <Space wrap>
            <Button icon={<ReloadOutlined />} danger onClick={handleClear}>
              Reset
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              loading={loading}
            >
              {isEditing ? "Update Data" : "Save Data"}
            </Button>
          </Space>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card className="shadow-sm">
          <Statistic
            title="Total Tithe"
            value={stats.totalTithe}
            prefix="₦"
            precision={2}
            valueStyle={{ color: "#3f8600" }}
          />
          <div className="text-sm text-gray-500 mt-2">
            {moment(selectedDate).format("MMMM YYYY")}
          </div>
        </Card>

        <Card className="shadow-sm">
          <Statistic
            title="Total Members"
            value={stats.totalMembers}
            prefix={<UserOutlined />}
            valueStyle={{ color: "#1890ff" }}
          />
          <div className="text-sm text-gray-500 mt-2">
            {stats.savedRecords > 0
              ? `${stats.savedRecords} saved`
              : "No saved data"}
          </div>
        </Card>

        <Card className="shadow-sm">
          <Statistic
            title="Average Tithe"
            value={stats.averageTithe}
            prefix="₦"
            precision={2}
            valueStyle={{ color: "#722ed1" }}
          />
          <div className="text-sm text-gray-500 mt-2">Per member</div>
        </Card>

       
      </div>

      {/* Main Data Table */}
      <div
        className="border rounded-lg shadow-sm bg-white overflow-auto"
        style={{ height: "calc(100vh - 400px)" }}
      >
        <HotTable
          ref={hotRef}
          data={data}
          colHeaders={colHeaders}
          columns={[
            { data: "name", type: "text", width: 220 },
            { data: "titheNumber", type: "text", width: 100 },
            { data: "week1", type: "numeric", width: 110 },
            { data: "week2", type: "numeric", width: 110 },
            { data: "week3", type: "numeric", width: 110 },
            { data: "week4", type: "numeric", width: 110 },
            ...(sundays.length === 5
              ? [{ data: "week5", type: "numeric", width: 110 }]
              : []),
            { data: "total", type: "numeric", readOnly: true, width: 120 },
          ]}
          afterChange={afterChange}
          stretchH="all"
          rowHeaders={true}
          contextMenu={true}
          licenseKey="non-commercial-and-evaluation"
        />
      </div>

      <Modal
        title={isEditing ? "Update Existing Data" : "Confirm Save"}
        open={isModalOpen}
        onOk={confirmSave}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        okText={isEditing ? "Update" : "Save"}
        cancelText="Cancel"
        okButtonProps={{ loading }}
      >
        <p>
          {isEditing ? (
            <>
              Update tithe records for <strong>{assembly}</strong> -{" "}
              {moment(selectedDate).format("MMMM YYYY")}?
            </>
          ) : (
            <>
              Save tithe records for <strong>{assembly}</strong> -{" "}
              {moment(selectedDate).format("MMMM YYYY")}?
            </>
          )}
        </p>
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
          initialValues={{ submittedBy }}
        >
          <Form.Item
            name="submittedBy"
            label="Submitted By"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input
              placeholder="Your full name"
              onChange={(e) => setSubmittedBy(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddTitheSheet;
