"use client";

import { useEffect, useState } from "react";
import { Table, Card, Spin } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

/* --------------------------- TYPES --------------------------- */

interface MidweekRecord {
  serviceName?: string;
  date?: string;
  attendance?: number;
  offering?: number;
  tithes?: number; // <-- ADDED
  total?: number;
}

interface MidweekService {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: MidweekRecord[];
}

interface RecordItem {
  week?: string;
  date?: string;
  attendance: number;
  sbsAttendance?: number;
  visitors?: number;
  tithes?: number;
  offerings?: number;
  specialOfferings?: number;
  total: number;
  totalAttendance?: number;
}

interface SundayService {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: RecordItem[];
}

interface SpecialServiceRecord {
  serviceName: string;
  date: string;
  attendance: number;
  offering: number;
}

interface SpecialService {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: SpecialServiceRecord[];
}

interface FinanceResponse {
  success: boolean;
  assembly: string;
  month: string;
  midweekServices: MidweekService[];
  sundayServices: SundayService[];
  specialServices: SpecialService[];
  summary: {
    totalOffering: number;
    totalTithes: number;
    grandTotal: number;
  };
}

/* --------------------------- COMPONENT --------------------------- */

export default function FinanceDashboard() {
  const [data, setData] = useState<FinanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/finance");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching finance:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFinance();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-center text-red-500">Failed to load data.</p>;
  }

  return (
    <div className="space-y-6 p-4">

      {/* SUMMARY */}
      <Card
        title="Finance Summary"
        extra={<ReloadOutlined onClick={fetchFinance} className="cursor-pointer" />}
        className="shadow rounded-xl"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-lg">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="font-semibold">Total Offering</p>
            <p className="text-blue-600 font-bold">₦{data.summary.totalOffering.toLocaleString()}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-xl">
            <p className="font-semibold">Total Tithes</p>
            <p className="text-green-600 font-bold">₦{data.summary.totalTithes.toLocaleString()}</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="font-semibold">Grand Total</p>
            <p className="text-purple-600 font-bold">₦{data.summary.grandTotal.toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* MIDWEEK SERVICES */}
      <Card title="Midweek Services" className="shadow rounded-xl">
        <Table
          rowKey="_id"
          dataSource={data.midweekServices}
          columns={[
            { title: "Assembly", dataIndex: "assembly" },
            { title: "Month", dataIndex: "month" },
            { title: "Submitted By", dataIndex: "submittedBy" },
            {
              title: "Total Attendance",
              render: (record: MidweekService) =>
                record.records.reduce((sum, r) => sum + (r.attendance || 0), 0),
            },
            {
              title: "Total Tithes",
              render: (record: MidweekService) =>
                record.records.reduce((sum, r) => sum + (r.tithes || 0), 0),
            },
            {
              title: "Total Offering",
              render: (record: MidweekService) =>
                record.records.reduce((sum, r) => sum + (r.offering || 0), 0),
            },
          ]}
          pagination={false}
        />
      </Card>

      {/* SPECIAL SERVICES */}
      <Card title="Special Services" className="shadow rounded-xl">
        <Table
          rowKey="_id"
          dataSource={data.specialServices}
          columns={[
            { title: "Assembly", dataIndex: "assembly" },
            { title: "Month", dataIndex: "month" },
            { title: "Submitted By", dataIndex: "submittedBy" },
            {
              title: "Total Attendance",
              render: (record: SpecialService) =>
                record.records.reduce((sum, r) => sum + r.attendance, 0),
            },
            {
              title: "Total Offering",
              render: (record: SpecialService) =>
                record.records.reduce((sum, r) => sum + r.offering, 0),
            },
          ]}
          pagination={false}
        />
      </Card>

      {/* SUNDAY SERVICES */}
      <Card title="Sunday Services" className="shadow rounded-xl">
        <Table
          rowKey="_id"
          dataSource={data.sundayServices}
          expandable={{
            expandedRowRender: (service: SundayService) => (
              <Table
                rowKey={(r) => r.week + r.date}
                dataSource={service.records}
                pagination={false}
                columns={[
                  { title: "Week", dataIndex: "week" },
                  { title: "Date", dataIndex: "date" },
                  { title: "Attendance", dataIndex: "attendance" },
                  { title: "SBS Attendance", dataIndex: "sbsAttendance" },
                  { title: "Visitors", dataIndex: "visitors" },
                  { title: "Tithes", dataIndex: "tithes" },
                  { title: "Offerings", dataIndex: "offerings" },
                  { title: "Special Offerings", dataIndex: "specialOfferings" },
                  { title: "Total", dataIndex: "total" },
                  { title: "Total Attendance", dataIndex: "totalAttendance" },
                ]}
              />
            ),
          }}
          columns={[
            { title: "Assembly", dataIndex: "assembly" },
            { title: "Month", dataIndex: "month" },
            { title: "Submitted By", dataIndex: "submittedBy" },
            {
              title: "Weeks",
              render: (record: SundayService) => record.records.length,
            },
            {
              title: "Grand Total",
              render: (record: SundayService) =>
                record.records.reduce((sum, r) => sum + (r.total || 0), 0),
            },
          ]}
          pagination={false}
        />
      </Card>
    </div>
  );
}
