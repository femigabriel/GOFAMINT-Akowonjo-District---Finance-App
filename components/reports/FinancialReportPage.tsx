// app/reports/FinancialReportPage.tsx
"use client";

import React, { useState, useRef } from "react";
import { DatePicker, Button, Spin, Table, message, Card, Row, Col, Statistic, Typography, Tag, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import html2pdf from "html2pdf.js";

const { Title, Text, Paragraph } = Typography;

type ComparisonRow = {
  assembly: string;
  current: { totalIncome: number; totalAttendance: number; totalTithes: number };
  prev1: { month?: string | null; totalIncome: number; totalAttendance: number; totalTithes: number };
  prev2: { month?: string | null; totalIncome: number; totalAttendance: number; totalTithes: number };
  change: { incomeVsPrev1: number; attendanceVsPrev1: number; tithesVsPrev1: number };
};

type Html2PdfOptions = {
  margin: number;
  filename: string;
  image: { type: "jpeg" | "png" | "webp"; quality: number };
  html2canvas: { scale: number };
  jsPDF: { unit: string; format: string; orientation: "portrait" | "landscape" };
};

export default function FinancialReportPage() {
  const [value, setValue] = useState<dayjs.Dayjs | null>(dayjs());
  const [loading, setLoading] = useState(false);
  const [reportMd, setReportMd] = useState<string>("");
  const [comparisons, setComparisons] = useState<ComparisonRow[]>([]);
  const [districtTotals, setDistrictTotals] = useState<any>(null);
  const [rawAggregated, setRawAggregated] = useState<any[]>([]);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const columns: ColumnsType<any> = [
    { 
      title: "Assembly", 
      dataIndex: "assembly", 
      key: "assembly",
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.current.totalIncome === 0 && (
            <Tag color="red" className="text-xs">Inactive</Tag>
          )}
        </div>
      )
    },
    { 
      title: "Income (₦)", 
      dataIndex: ["current", "totalIncome"], 
      key: "income", 
      render: (v:number) => (
        <div className={`font-medium ${v === 0 ? 'text-red-500' : 'text-green-700'}`}>
          ₦{v.toLocaleString()}
        </div>
      ),
      sorter: (a, b) => a.current.totalIncome - b.current.totalIncome
    },
    { 
      title: "Attendance", 
      dataIndex: ["current", "totalAttendance"], 
      key: "attendance",
      render: (v:number) => (
        <div className="font-medium">{v.toLocaleString()}</div>
      ),
      sorter: (a, b) => a.current.totalAttendance - b.current.totalAttendance
    },
    { 
      title: "Tithes (₦)", 
      dataIndex: ["current", "totalTithes"], 
      key: "tithes", 
      render: (v:number) => (
        <div className="font-medium">₦{v.toLocaleString()}</div>
      ),
      sorter: (a, b) => a.current.totalTithes - b.current.totalTithes
    },
    { 
      title: "% Income Change", 
      dataIndex: ["change", "incomeVsPrev1"], 
      key: "change", 
      render: (v:number) => {
        const isPositive = v >= 0;
        const isZero = v === 0;
        return (
          <Tag 
            color={isZero ? "default" : isPositive ? "green" : "red"}
            className="font-medium"
          >
            {v >= 0 ? "+" : ""}{v.toFixed(0)}%
          </Tag>
        );
      },
      sorter: (a, b) => a.change.incomeVsPrev1 - b.change.incomeVsPrev1
    },
  ];

  async function generate() {
    if (!value) return message.error("Choose a month first");
    const month = value.format("MMMM");
    const year = value.format("YYYY");

    setLoading(true);
    setReportMd("");
    setComparisons([]);
    setDistrictTotals(null);
    setRawAggregated([]);

    try {
      const res = await fetch("/api/generate/financial-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, year }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        message.error(data.error || "Could not generate report");
        setLoading(false);
        return;
      }

      setReportMd(data.report || "");
      setComparisons(data.comparisons || []);
      setDistrictTotals(data.districtTotals || null);
      setRawAggregated(data.rawAggregated || []);
      message.success("Report generated successfully!");
    } catch (err) {
      console.error(err);
      message.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf() {
    if (!reportRef.current) return message.error("Nothing to download");
    
    // Create church header for PDF
    const churchHeader = document.createElement('div');
    churchHeader.className = 'church-header';
    churchHeader.style.cssText = `
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #1890ff;
    `;
    
    churchHeader.innerHTML = `
      <h1 style="margin: 0; color: #1d39c4; font-size: 24px; font-weight: bold;">
        The Gospel Faith Mission Int'l
      </h1>
      <h2 style="margin: 5px 0; color: #595959; font-size: 18px; font-weight: 600;">
        Region 6, AKowonjo District
      </h2>
      <h3 style="margin: 10px 0; color: #8c8c8c; font-size: 16px; font-weight: 500;">
        Financial Report for ${value?.format("MMMM YYYY") || ""}
      </h3>
    `;
    
    // Clone the report content
    const content = reportRef.current.cloneNode(true) as HTMLElement;
    
    // Insert church header at the beginning
    content.insertBefore(churchHeader, content.firstChild);
    
    const opt: Html2PdfOptions = {
      margin: 0.5,
      filename: `Financial-Report-${value?.format("MMMM-YYYY") || "report"}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(content).save();
  }

  function getTopPerformers() {
    return [...comparisons]
      .filter(c => c.current.totalIncome > 0)
      .sort((a, b) => b.current.totalIncome - a.current.totalIncome)
      .slice(0, 3);
  }

  function getInactiveAssemblies() {
    return comparisons.filter(c => c.current.totalIncome === 0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Church Header */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="text-center">
            <h1  className="!mb-0 text-[#1d39c4] text-xl">
    The Gospel Faith Mission Int'l
            </h1>
            <h3  className="!mb-0 text-gray-700 text-sm">
              Region 6, AKowonjo District
            </h3>
            <p className="text-gray-600 text-base">
              Financial Reporting System
            </p>
          </div>
        </Card>

        {/* Header */}
        <Card className="mb-6 border-0 shadow-lg">
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <div>
                <Title level={2} className="!mb-2 text-gray-800">
                  District Financial Report
                </Title>
                <Text type="secondary" className="text-base">
                  Generate comprehensive AI analysis for the entire district
                </Text>
              </div>
            </Col>
            
            <Col xs={24} md={12}>
              <div className="flex flex-col md:flex-row gap-3 items-end md:items-center justify-end">
                <div className="w-full md:w-auto">
                  <Text strong className="block mb-2">Select Month</Text>
                  <DatePicker
                    picker="month"
                    value={value}
                    onChange={(v) => setValue(v)}
                    className="!w-full md:!w-56"
                    allowClear={false}
                    size="large"
                  />
                </div>
                <Space direction="vertical" className="w-full md:w-auto">
                  <Button 
                    type="primary" 
                    onClick={generate} 
                    disabled={loading}
                    size="large"
                    loading={loading}
                    className="w-full md:w-auto"
                    block={window.innerWidth < 768}
                  >
                    {loading ? "Generating..." : "Generate Report"}
                  </Button>
                  <Button 
                    onClick={downloadPdf} 
                    disabled={!reportMd || loading}
                    size="large"
                    type="default"
                    className="w-full md:w-auto"
                    block={window.innerWidth < 768}
                  >
                    Download PDF
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Main Content */}
        <div ref={reportRef}>
          {/* Report Header for PDF */}
          <div className="pdf-only" style={{ display: 'none' }}>
            <div className="church-header-pdf">
              <h1>The Gospel Faith Mission Int'l</h1>
              <h2>Region 6, AKowonjo District</h2>
              <h3>Financial Report for {value?.format("MMMM YYYY") || ""}</h3>
            </div>
          </div>

          {/* Executive Summary Card */}
          {districtTotals && (
            <Card className="mb-6 border-0 shadow-lg" id="executive-summary">
              <div className="text-center mb-6">
                <Title level={3} className="!mb-2 text-gray-800">
                  Executive Summary
                </Title>
                <Text strong className="text-lg text-blue-600">
                  {value?.format("MMMM YYYY")}
                </Text>
              </div>
              
              <Row gutter={[16, 16]} className="mb-6">
                <Col xs={24} md={8}>
                  <Card className="border-0 bg-gradient-to-r from-blue-50 to-blue-100">
                    <Statistic
                      title="Total Income"
                      value={districtTotals.totalIncome}
                      prefix="₦"
                      valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                      formatter={(value) => value.toLocaleString()}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="border-0 bg-gradient-to-r from-green-50 to-green-100">
                    <Statistic
                      title="Total Attendance"
                      value={districtTotals.totalAttendance}
                      valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
                      formatter={(value) => value.toLocaleString()}
                    />
                  </Card>
                </Col>
                <Col xs={24} md={8}>
                  <Card className="border-0 bg-gradient-to-r from-purple-50 to-purple-100">
                    <Statistic
                      title="Total Tithes"
                      value={districtTotals.totalTithes}
                      prefix="₦"
                      valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
                      formatter={(value) => value.toLocaleString()}
                    />
                  </Card>
                </Col>
              </Row>

              {/* Top Performers */}
              <div className="mb-6">
                <Title level={4} className="!mb-4">Top Performing Assemblies</Title>
                <Row gutter={[16, 16]}>
                  {getTopPerformers().map((assembly, index) => (
                    <Col xs={24} md={8} key={assembly.assembly}>
                      <Card 
                        className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300"
                        style={{ borderLeft: `4px solid ${index === 0 ? '#faad14' : index === 1 ? '#d9d9d9' : '#ffd666'}` }}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className={`w-6 h-6 flex items-center justify-center rounded-full ${
                                index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                                index === 1 ? 'bg-gray-100 text-gray-600' : 
                                'bg-orange-100 text-orange-600'
                              }`}>
                                {index + 1}
                              </div>
                              <Title level={5} className="!mb-0">{assembly.assembly}</Title>
                            </div>
                            <Tag color="green" className="mb-2">
                              +{assembly.change.incomeVsPrev1}% Growth
                            </Tag>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Text type="secondary">Income</Text>
                            <Text strong className="text-green-700">
                              ₦{assembly.current.totalIncome.toLocaleString()}
                            </Text>
                          </div>
                          <div className="flex justify-between">
                            <Text type="secondary">Attendance</Text>
                            <Text strong>{assembly.current.totalAttendance.toLocaleString()}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text type="secondary">Tithes</Text>
                            <Text strong>₦{assembly.current.totalTithes.toLocaleString()}</Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Inactive Assemblies */}
              {getInactiveAssemblies().length > 0 && (
                <div className="mb-6">
                  <Title level={4} className="!mb-4">Assemblies Requiring Attention</Title>
                  <div className="space-y-3">
                    {getInactiveAssemblies().map(assembly => (
                      <Card key={assembly.assembly} className="border-0 bg-red-50">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-2">
                              <Text strong className="text-red-600">{assembly.assembly}</Text>
                              <Tag color="red">Inactive</Tag>
                            </div>
                            <Text type="secondary">No activity reported for this month</Text>
                          </div>
                          <div className="text-right">
                            <Text type="secondary">3 consecutive months</Text>
                            <div className="text-red-600 font-medium">Immediate action required</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                <Title level={4} className="!mb-4">Key Insights</Title>
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Paragraph className="text-gray-700">
                      <strong>Positive Trend:</strong> District performance rebounded sharply after two months of inactivity, showing strong post-lull recovery across most assemblies.
                    </Paragraph>
                  </Col>
                  <Col xs={24} md={12}>
                    <Paragraph className="text-gray-700">
                      <strong>Areas for Improvement:</strong> Persistent non-reporting from some assemblies indicates potential engagement or operational issues that require targeted intervention.
                    </Paragraph>
                  </Col>
                </Row>
              </div>
            </Card>
          )}

          {/* Detailed Comparisons */}
          <Card className="mb-6 border-0 shadow-lg" id="detailed-comparisons">
            <div className="flex justify-between items-center mb-6">
              <div>
                <Title level={3} className="!mb-2">Assembly Performance Details</Title>
                <Text type="secondary">
                  Detailed comparison of all assemblies with percentage changes
                </Text>
              </div>
              <div className="text-right">
                <Text strong>Active Assemblies: </Text>
                <Tag color="blue">{comparisons.filter(c => c.current.totalIncome > 0).length}</Tag>
                <Text strong className="ml-4">Inactive: </Text>
                <Tag color="red">{comparisons.filter(c => c.current.totalIncome === 0).length}</Tag>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table
                columns={columns}
                dataSource={comparisons}
                rowKey="assembly"
                pagination={false}
                bordered
                size="middle"
                scroll={{ x: 800 }}
                rowClassName={(record) => 
                  record.current.totalIncome === 0 ? 'bg-red-50' : ''
                }
              />
            </div>
          </Card>

          {/* Raw Data Summary */}
          {rawAggregated.length > 0 && (
            <Card className="border-0 shadow-lg" id="raw-data">
              <Title level={3} className="!mb-4">Detailed Breakdown by Assembly</Title>
              <div className="space-y-6">
                {rawAggregated.map((assembly) => {
                  const offerings = assembly.offeringsBreakdown || {};
                  const hasOfferings = Object.keys(offerings).length > 0;
                  
                  return (
                    <Card 
                      key={assembly.assembly} 
                      className={`border-l-4 ${
                        assembly.totalIncome === 0 ? 'border-red-300' : 'border-green-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Title level={5} className="!mb-1">{assembly.assembly}</Title>
                          <div className="flex gap-3">
                            <Tag color={assembly.totalIncome > 0 ? "green" : "red"}>
                              Income: ₦{assembly.totalIncome.toLocaleString()}
                            </Tag>
                            <Tag color={assembly.totalAttendance > 0 ? "blue" : "default"}>
                              Attendance: {assembly.totalAttendance}
                            </Tag>
                            <Tag color="purple">
                              Tithes: ₦{assembly.totalTithes.toLocaleString()}
                            </Tag>
                          </div>
                        </div>
                        <div className="text-right">
                          <Text type="secondary">{assembly.totalRecords} record(s)</Text>
                        </div>
                      </div>
                      
                      {hasOfferings && (
                        <div>
                          <Text strong className="block mb-2">Offerings Breakdown:</Text>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {Object.entries(offerings).map(([key, value]: [string, unknown]) => {
                              const numValue = Number(value);
                              return numValue > 0 && (
                                <Card key={key} size="small" className="text-center">
                                  <div className="text-xs text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  <div className="font-bold">₦{numValue.toLocaleString()}</div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="text-center p-8">
              <Spin size="large" />
              <Title level={4} className="!mt-4 !mb-2">Generating Report</Title>
              <Text type="secondary">Analyzing data and creating insights...</Text>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !reportMd && !districtTotals && (
          <Card className="text-center py-16 border-0 shadow-lg">
            <div className="text-5xl mb-6">📊</div>
            <Title level={3} className="!mb-4">No Report Generated Yet</Title>
            <Paragraph type="secondary" className="text-lg mb-8">
              Select a month and click "Generate Report" to create a comprehensive financial analysis for your district.
            </Paragraph>
            <div className="flex justify-center gap-4">
              <DatePicker
                picker="month"
                value={value}
                onChange={(v) => setValue(v)}
                className="!w-56"
                allowClear={false}
              />
              <Button type="primary" size="large" onClick={generate}>
                Generate Your First Report
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* CSS for PDF header */}
      <style jsx global>{`
        @media print {
          .church-header-pdf {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #1890ff;
          }
          
          .church-header-pdf h1 {
            margin: 0;
            color: #1d39c4;
            font-size: 24px;
            font-weight: bold;
          }
          
          .church-header-pdf h2 {
            margin: 5px 0;
            color: #595959;
            font-size: 18px;
            font-weight: 600;
          }
          
          .church-header-pdf h3 {
            margin: 10px 0;
            color: #8c8c8c;
            font-size: 16px;
            font-weight: 500;
          }
        }
      `}</style>
    </div>
  );
}