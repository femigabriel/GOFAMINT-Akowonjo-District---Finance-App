// components/dashboard/SpecialServiceReport.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Button,
  Table,
  Space,
  Popconfirm,
  notification,
  Modal,
  Row,
  Col,
  Statistic,
  Grid,
} from "antd";
import {
  SaveOutlined,
  DeleteOutlined,
  PlusOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";
import { format, parseISO, isValid } from "date-fns";

const { useBreakpoint } = Grid;

interface SpecialServiceRecord {
  _id?: string;
  serviceName: string;
  date: string;
  attendance: number;
  offering: number;
}

interface SpecialServiceReportProps {
  assembly: string | null;
}

const SpecialServiceReport: React.FC<SpecialServiceReportProps> = ({ assembly }) => {
  const [form] = Form.useForm();
  const [records, setRecords] = useState<SpecialServiceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittedBy, setSubmittedBy] = useState("");
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const screens = useBreakpoint();

  // Safe number formatting function
  const safeToLocaleString = (value: any): string => {
    const num = Number(value) || 0;
    return num.toLocaleString();
  };

  // Safe date formatting function
  const safeFormatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date';
    } catch {
      return 'Invalid Date';
    }
  };

  // Fetch existing special service records
const fetchRecords = useCallback(async () => {
  if (!assembly) {
    setRecords([]);
    return;
  }

  setLoading(true);
  try {
    const month = format(selectedMonth, "MMMM-yyyy");
    const resp = await fetch(
      `/api/sunday-service-reports?assembly=${encodeURIComponent(
        assembly
      )}&month=${encodeURIComponent(month)}&serviceType=special`
    );

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    
    const data = await resp.json();
    
    // Handle both the document structure and records array
    const recordsData = data.records || [];
    
    // Ensure we have an array and safe data
    const safeRecords = Array.isArray(recordsData) 
      ? recordsData.map((record: any) => ({
          _id: record._id || '',
          serviceName: record.serviceName || '',
          date: record.date || format(new Date(), 'yyyy-MM-dd'),
          attendance: Number(record.attendance) || 0,
          offering: Number(record.offering) || 0,
        }))
      : [];
    
    setRecords(safeRecords);
  } catch (error: any) {
    console.error("Failed to fetch special service records:", error);
    notification.error({
      message: "Load Failed",
      description: error.message || "Failed to load special service records",
    });
    setRecords([]);
  } finally {
    setLoading(false);
  }
}, [assembly, selectedMonth]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Add new special service record
  const addRecord = (values: any) => {
    const newRecord: SpecialServiceRecord = {
      serviceName: values.serviceName?.trim() || '',
      date: values.date?.format("YYYY-MM-DD") || format(new Date(), 'yyyy-MM-dd'),
      attendance: Number(values.attendance) || 0,
      offering: Number(values.offering) || 0,
    };

    if (!newRecord.serviceName) {
      notification.error({
        message: "Validation Error",
        description: "Service name is required",
      });
      return;
    }

    setRecords(prev => [...prev, newRecord]);
    form.resetFields();
    notification.success({
      message: "Record Added",
      description: "Special service record added successfully",
    });
  };

  // Delete record
  const deleteRecord = (index: number) => {
    const newRecords = records.filter((_, i) => i !== index);
    setRecords(newRecords);
    notification.success({
      message: "Record Deleted",
      description: "Special service record removed",
    });
  };

  // Save all records to database
  const saveRecords = async () => {
    if (!assembly) {
      notification.error({ message: "No assembly selected" });
      return;
    }

    if (!submittedBy.trim()) {
      notification.error({ message: "Please enter your name" });
      return;
    }

    if (records.length === 0) {
      notification.error({ message: "No records to save" });
      return;
    }

    setLoading(true);
    try {
      const month = format(selectedMonth, "MMMM-yyyy");
      const payload = {
        assembly,
        submittedBy: submittedBy.trim(),
        month,
        records: records.map(record => ({
          serviceName: record.serviceName,
          date: record.date,
          attendance: Number(record.attendance) || 0,
          offering: Number(record.offering) || 0,
        })),
        serviceType: "special"
      };

      console.log("Saving special service records:", payload);

      const resp = await fetch("/api/sunday-service-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`HTTP ${resp.status}: ${errorText}`);
      }

      const result = await resp.json();
      
      notification.success({
        message: "Successfully Saved!",
        description: `Special service report for ${format(selectedMonth, "MMMM yyyy")} has been saved.`,
      });

      setSaveModalVisible(false);
      setSubmittedBy("");
      fetchRecords(); // Refresh data

    } catch (error: any) {
      console.error("Save failed:", error);
      notification.error({
        message: "Save Failed",
        description: error.message || "Failed to save special service records",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals safely
  const totals = {
    totalAttendance: records.reduce((sum, record) => sum + (Number(record.attendance) || 0), 0),
    totalOffering: records.reduce((sum, record) => sum + (Number(record.offering) || 0), 0),
    totalServices: records.length,
  };

  // Table columns
  const columns = [
    {
      title: 'Service Name',
      dataIndex: 'serviceName',
      key: 'serviceName',
      width: screens.xs ? 120 : 200,
      render: (text: string) => (
        <span className="font-medium text-gray-800">{text || 'Unnamed Service'}</span>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: safeFormatDate,
    },
    {
      title: 'Attendance',
      dataIndex: 'attendance',
      key: 'attendance',
      width: 100,
      align: 'right' as const,
      render: (attendance: any) => safeToLocaleString(attendance),
    },
    {
      title: 'Offering (₦)',
      dataIndex: 'offering',
      key: 'offering',
      width: 120,
      align: 'right' as const,
      render: (offering: any) => `₦${safeToLocaleString(offering)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title="Delete this record?"
          description="Are you sure you want to delete this special service record?"
          onConfirm={() => deleteRecord(index)}
          okText="Yes"
          cancelText="No"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
          />
        </Popconfirm>
      ),
    },
  ];

  const handleMonthChange = (m: moment.Moment | null) => {
    if (m) setSelectedMonth(m.toDate());
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-6 border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <CalendarOutlined className="text-white text-lg" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
              Special Services Report
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {format(selectedMonth, "MMMM yyyy")} • {assembly || 'No Assembly'} • Special Programs & Events
            </p>
          </div>
        </div>

        <DatePicker.MonthPicker
          value={moment(selectedMonth)}
          onChange={handleMonthChange}
          className="rounded-lg w-full sm:w-auto"
          size={screens.xs ? "small" : "middle"}
          allowClear={false}
        />
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={8}>
          <Card className="border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl shadow-md">
            <Statistic
              title="Total Services"
              value={totals.totalServices}
              valueStyle={{ color: '#fff', fontSize: screens.xs ? '24px' : '28px' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-0 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md">
            <Statistic
              title="Total Attendance"
              value={totals.totalAttendance}
              valueStyle={{ color: '#fff', fontSize: screens.xs ? '24px' : '28px' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl shadow-md">
            <Statistic
              title="Total Offering"
              value={totals.totalOffering}
              prefix="₦"
              valueStyle={{ color: '#fff', fontSize: screens.xs ? '24px' : '28px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Add New Record Form */}
      <Card title="Add Special Service Record" className="mb-6 shadow-sm border">
        <Form
          form={form}
          layout="vertical"
          onFinish={addRecord}
          size={screens.xs ? "small" : "middle"}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item
                name="serviceName"
                label="Service Name"
                rules={[{ required: true, message: 'Please enter service name' }]}
              >
                <Input
                  placeholder="e.g., First Sunday Service, Youth Conference, etc."
                  className="rounded-lg"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
                initialValue={moment()}
              >
                <DatePicker
                  className="rounded-lg w-full"
                  format="MMM DD, YYYY"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Form.Item
                name="attendance"
                label="Attendance"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  className="rounded-lg w-full"
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Form.Item
                name="offering"
                label="Offering (₦)"
                initialValue={0}
              >
                <InputNumber
                  min={0}
                  step={1000}
                  className="rounded-lg w-full"
                  placeholder="0"
                  formatter={value => `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value?.replace(/₦\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={2}>
              <Form.Item label=" ">
                <Button
                  type="primary"
                  htmlType="submit"
                //   icon={<PlusOutlined />}
                  className="rounded-lg w-full bg-green-600 hover:bg-green-700"
                  size={screens.xs ? "small" : "middle"}
                >
                  {/* {screens.sm && "Add"} */}
                  Add
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Records Table */}
      <Card 
        title={`Special Services Records (${records.length})`} 
        className="shadow-sm border"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => setSaveModalVisible(true)}
            loading={loading}
            disabled={records.length === 0}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg"
            size={screens.xs ? "small" : "middle"}
          >
            {screens.sm && "Save All"}
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={records.map((record, index) => ({ 
            ...record, 
            key: index 
          }))}
          loading={loading}
          pagination={false}
          scroll={{ x: true }}
          size={screens.xs ? "small" : "middle"}
          locale={{ emptyText: "No special service records added yet" }}
        />
      </Card>

      {/* Save Confirmation Modal */}
      <Modal
        title="Confirm Save - Special Services Report"
        open={saveModalVisible}
        onOk={saveRecords}
        onCancel={() => {
          setSaveModalVisible(false);
          setSubmittedBy("");
        }}
        confirmLoading={loading}
        okText="Save"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-blue-600 hover:bg-blue-700 rounded-lg" }}
        width={screens.xs ? 350 : 500}
      >
        <div className="space-y-4 py-4">
          <div>
            <p className="text-gray-600 mb-2">
              You are about to save <strong>{records.length}</strong> special service record(s) for{" "}
              <strong>{format(selectedMonth, "MMMM yyyy")}</strong>.
            </p>
            <p className="text-sm text-gray-500">
              Total: {safeToLocaleString(totals.totalAttendance)} attendance • ₦{safeToLocaleString(totals.totalOffering)} offering
            </p>
          </div>
          
          <Input
            placeholder="Enter your full name"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
            className="rounded-lg h-10"
            prefix={<UserOutlined />}
          />
        </div>
      </Modal>
    </div>
  );
};

export default SpecialServiceReport;