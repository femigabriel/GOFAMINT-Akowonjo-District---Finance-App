"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Card,
  Input,
  Select,
  Space,
  Typography,
  Empty,
  Spin,
  Tag,
  Divider,
  Badge,
  Button,
  DatePicker,
  Statistic,
  Alert,
  Row,
  Col,
  Grid,
} from "antd";
import { HotTable, HotTableClass } from "@handsontable/react";
import "handsontable/dist/handsontable.full.min.css";
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  CalendarOutlined,
  EyeOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  SyncOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { Church, Users, ChevronRight } from "lucide-react";
import moment from "moment";
import { titheData } from "@/lib/tithe-data";
import { registerAllCellTypes } from "handsontable/cellTypes";
import type { CellChange, ChangeSource } from "handsontable/common";

// Register all cell types to fix the numeric cell type error
registerAllCellTypes();

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

interface Member {
  sn: number;
  name: string;
  memberId: string;
}

interface AssemblyData {
  assembly: string;
  members: Array<{ sn: number; name: string }>;
}

interface TitheRecord {
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

interface DatabaseRecord {
  _id: string;
  assembly: string;
  submittedBy: string;
  month: string;
  records: TitheRecord[];
  createdAt: string;
  updatedAt?: string;
}

const ChurchMembersDirectory = () => {
  const hotRef = useRef<HotTableClass>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedAssembly, setSelectedAssembly] = useState<string>("");
  const [allAssemblies, setAllAssemblies] = useState<AssemblyData[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [submittedData, setSubmittedData] = useState<DatabaseRecord[]>([]);
  const [currentMonthData, setCurrentMonthData] = useState<TitheRecord[]>([]);
  const [assemblyMembers, setAssemblyMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState({
    totalTithe: 0,
    totalMembers: 0,
    paidMembers: 0,
    unpaidMembers: 0,
    averageTithe: 0,
    submissionsCount: 0,
    totalAmount: 0,
  });
  const [tableHeight, setTableHeight] = useState("600px");
  
  const screens = useBreakpoint();

  // Initialize with data from titheData
  useEffect(() => {
    if (titheData && titheData.length > 0) {
      setAllAssemblies(titheData);
      const firstAssembly = titheData[0].assembly;
      setSelectedAssembly(firstAssembly);
      loadAssemblyMembers(firstAssembly);
    }
    
    // Adjust table height on mount and resize
    updateTableHeight();
    window.addEventListener("resize", updateTableHeight);
    
    return () => {
      window.removeEventListener("resize", updateTableHeight);
    };
  }, []);

  const updateTableHeight = () => {
    // Calculate height based on available space
    const headerHeight = 300;
    const controlHeight = 200;
    const windowHeight = window.innerHeight;
    const calculatedHeight = windowHeight - headerHeight - controlHeight;
    
    setTableHeight(`${Math.max(400, calculatedHeight)}px`);
  };

  // Load all submitted data for the selected month
  const loadSubmittedData = async () => {
    try {
      const monthStr = moment(selectedDate).format("MMMM-YYYY");
      const response = await fetch(`/api/tithes?month=${monthStr}`);
      const result = await response.json();
      
      if (result.success) {
        setSubmittedData(result.data);
        updateStatsFromSubmittedData(result.data);
      }
    } catch (error) {
      console.error("Error loading submitted data:", error);
    }
  };

  // Update stats from submitted data
  const updateStatsFromSubmittedData = (data: DatabaseRecord[]) => {
    const totalTithe = data.reduce((sum, record) => 
      sum + record.records.reduce((recordSum, r) => recordSum + (r.total || 0), 0), 0
    );
    
    const totalMembers = data.reduce((sum, record) => sum + record.records.length, 0);
    const paidMembers = data.reduce((sum, record) => 
      sum + record.records.filter(r => (r.total || 0) > 0).length, 0
    );
    const unpaidMembers = totalMembers - paidMembers;
    const averageTithe = paidMembers > 0 ? totalTithe / paidMembers : 0;

    setStats({
      totalTithe,
      totalMembers,
      paidMembers,
      unpaidMembers,
      averageTithe,
      submissionsCount: data.length,
      totalAmount: totalTithe,
    });
  };

  // Load members for selected assembly
  const loadAssemblyMembers = (assemblyName: string) => {
    const assembly = allAssemblies.find((a) => a.assembly === assemblyName);
    if (!assembly) {
      setAssemblyMembers([]);
      return;
    }

    // Create members with IDs
    let members = assembly.members.map((member) => ({
      ...member,
      memberId: `M${member.sn.toString().padStart(3, "0")}`,
    }));

    // Apply sorting
    members = members.sort((a, b) => {
      if (sortOrder === "asc") {
        return a.sn - b.sn;
      } else {
        return b.sn - a.sn;
      }
    });

    setAssemblyMembers(members);
    loadAssemblySubmittedData(assemblyName);
  };

  // Load submitted data for specific assembly
  const loadAssemblySubmittedData = async (assemblyName: string) => {
    setLoading(true);
    try {
      const monthStr = moment(selectedDate).format("MMMM-YYYY");
      const response = await fetch(
        `/api/tithes?assembly=${encodeURIComponent(assemblyName)}&month=${monthStr}`
      );
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const savedRecord = result.data[0];
        setCurrentMonthData(savedRecord.records);
      } else {
        setCurrentMonthData([]);
      }
    } catch (error) {
      console.error("Error loading assembly data:", error);
      setCurrentMonthData([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle assembly and date changes
  useEffect(() => {
    if (selectedAssembly) {
      loadAssemblyMembers(selectedAssembly);
    }
    loadSubmittedData();
  }, [selectedAssembly, selectedDate, sortOrder]);

  // Get unique assemblies for dropdown
  const assemblyOptions = useMemo(() => {
    return allAssemblies.map((assembly) => ({
      label: assembly.assembly,
      value: assembly.assembly,
      membersCount: assembly.members.length,
    }));
  }, [allAssemblies]);

  // Get current assembly data
  const currentAssembly = useMemo(() => {
    return allAssemblies.find((a) => a.assembly === selectedAssembly);
  }, [selectedAssembly, allAssemblies]);

  // Get month name for display
  const monthName = useMemo(() => {
    return moment(selectedDate).format("MMMM YYYY");
  }, [selectedDate]);

  // Get data for Handsontable with search filter
  const getTableData = useMemo(() => {
    let data = currentMonthData.length > 0 ? currentMonthData : assemblyMembers.map((member, index) => ({
      _sn: index + 1,
      name: member.name,
      titheNumber: member.memberId,
      week1: 0,
      week2: 0,
      week3: 0,
      week4: 0,
      week5: 0,
      total: 0,
    }));

    // Apply search filter if there's search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      data = data.filter(
        (row) =>
          row.name.toLowerCase().includes(searchLower) ||
          row.titheNumber.toLowerCase().includes(searchLower)
      );
    }

    return data;
  }, [currentMonthData, assemblyMembers, searchText]);

  // Get submission status for current assembly/month
  const getSubmissionStatus = () => {
    if (currentMonthData.length > 0) {
      const record = submittedData.find(
        (record) => 
          record.assembly === selectedAssembly && 
          record.month === moment(selectedDate).format("MMMM-YYYY")
      );
      return {
        submitted: true,
        record,
        submittedBy: record?.submittedBy || "Unknown",
        submittedDate: record?.updatedAt || record?.createdAt,
      };
    }
    return { submitted: false, record: null, submittedBy: "", submittedDate: "" };
  };

  const submissionStatus = getSubmissionStatus();

  // Calculate stats for current assembly
  const currentAssemblyStats = useMemo(() => {
    if (currentMonthData.length > 0) {
      const totalTithe = currentMonthData.reduce((sum, record) => sum + (record.total || 0), 0);
      const paidMembers = currentMonthData.filter(r => (r.total || 0) > 0).length;
      const unpaidMembers = currentMonthData.length - paidMembers;
      const averageTithe = paidMembers > 0 ? totalTithe / paidMembers : 0;
      
      return {
        totalTithe,
        totalMembers: currentMonthData.length,
        paidMembers,
        unpaidMembers,
        averageTithe,
      };
    }
    
    return {
      totalTithe: 0,
      totalMembers: assemblyMembers.length,
      paidMembers: 0,
      unpaidMembers: assemblyMembers.length,
      averageTithe: 0,
    };
  }, [currentMonthData, assemblyMembers]);

  // Export data to Excel
  const exportToExcel = () => {
    if (getTableData.length === 0) return;
    
    try {
      const headers = ["SN", "Member ID", "Full Name", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Total"];
      const csvContent = [
        headers.join(","),
        ...getTableData.map(row => [
          row._sn,
          `"${row.titheNumber}"`,
          `"${row.name}"`,
          row.week1,
          row.week2,
          row.week3,
          row.week4,
          row.week5 || 0,
          row.total
        ].join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Tithe_${selectedAssembly}_${moment(selectedDate).format("MMM_YYYY")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  // Refresh data
  const refreshData = () => {
    if (selectedAssembly) {
      loadAssemblyMembers(selectedAssembly);
      loadSubmittedData();
    }
  };

  const handleAssemblyChange = (value: string) => {
    setSelectedAssembly(value);
    setSearchText("");
  };

  const handleClearSearch = () => {
    setSearchText("");
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handleDateChange = (date: moment.Moment | null) => {
    if (date) {
      setSelectedDate(date.toDate());
    }
  };

  // Responsive column configuration
  const columns = useMemo(() => {
    const baseColumns = [
      {
        data: "_sn",
        type: "numeric",
        width: screens.xs ? 40 : 60,
        readOnly: true,
        className: "htCenter",
      },
      {
        data: "titheNumber",
        type: "text",
        width: screens.xs ? 70 : 90,
        readOnly: true,
      },
      {
        data: "name",
        type: "text",
        width: screens.xs ? 150 : 200,
        readOnly: true,
      },
      {
        data: "week1",
        type: "numeric",
        width: screens.xs ? 60 : 80,
        readOnly: true,
        numericFormat: { pattern: "0,0" },
      },
      {
        data: "week2",
        type: "numeric",
        width: screens.xs ? 60 : 80,
        readOnly: true,
        numericFormat: { pattern: "0,0" },
      },
      {
        data: "week3",
        type: "numeric",
        width: screens.xs ? 60 : 80,
        readOnly: true,
        numericFormat: { pattern: "0,0" },
      },
      {
        data: "week4",
        type: "numeric",
        width: screens.xs ? 60 : 80,
        readOnly: true,
        numericFormat: { pattern: "0,0" },
      },
      {
        data: "week5",
        type: "numeric",
        width: screens.xs ? 60 : 80,
        readOnly: true,
        numericFormat: { pattern: "0,0" },
      },
      {
        data: "total",
        type: "numeric",
        width: screens.xs ? 70 : 90,
        readOnly: true,
        numericFormat: { pattern: "0,0" },
        className: "htBold",
      },
    ];
    
    return baseColumns;
  }, [screens.xs]);

  const colHeaders = ["SN", "ID", "Name", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Total"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-white rounded-xl md:rounded-2xl shadow-lg">
              <DatabaseOutlined className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            </div>
            <div>
              <Title level={screens.xs ? 4 : 2} className="!mb-1 !text-slate-800">
                Tithe Data Monitor
              </Title>
              <Text type="secondary" className="text-xs md:text-base">
                View submitted tithe records from all churches
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Church className="w-4 h-4 text-blue-500" />
              <Text strong className="text-blue-600 text-sm">
                {allAssemblies.reduce((sum, a) => sum + a.members.length, 0)} Total Members
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Row gutter={[16, 16]}>
        {/* Left Panel - Assembly List & Controls */}
        <Col xs={24} lg={6}>
          <Card className="shadow-lg border-0 rounded-xl md:rounded-2xl bg-white h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FilterOutlined className="text-blue-600" />
              </div>
              <Title level={5} className="!mb-0 !text-slate-700">
                Filters
              </Title>
            </div>

            <div className="space-y-4">
              <div>
                <Text strong className="block mb-1 text-slate-600 text-sm">
                  Select Assembly
                </Text>
                <Select
                  placeholder="Select Assembly"
                  className="w-full"
                  size={screens.xs ? "middle" : "large"}
                  value={selectedAssembly}
                  onChange={handleAssemblyChange}
                  options={assemblyOptions}
                  optionRender={(option) => (
                    <div className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <Church className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                        <span className="text-sm md:text-base">{option.label}</span>
                      </div>
                      <Badge 
                        count={option.data.membersCount} 
                        style={{ backgroundColor: '#3b82f6' }}
                        size="small"
                      />
                    </div>
                  )}
                  dropdownStyle={{ borderRadius: "12px" }}
                />
              </div>

              <div>
                <Text strong className="block mb-1 text-slate-600 text-sm">
                  Select Month
                </Text>
                <DatePicker.MonthPicker
                  className="w-full"
                  size={screens.xs ? "middle" : "large"}
                  value={moment(selectedDate)}
                  onChange={handleDateChange}
                  format="MMMM YYYY"
                  allowClear={false}
                  suffixIcon={<CalendarOutlined />}
                />
              </div>

              <div>
                <Text strong className="block mb-1 text-slate-600 text-sm">
                  Search Members
                </Text>
                <Input
                  placeholder="Search by name or ID..."
                  prefix={<SearchOutlined className="text-slate-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                  size={screens.xs ? "middle" : "large"}
                  className="rounded-lg border-slate-200"
                />
              </div>
            </div>

            <Divider className="!my-4" />

            {/* Assembly Stats */}
            {currentAssembly && (
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CalendarOutlined className="w-4 h-4 text-blue-600" />
                      <Text strong className="text-slate-700 text-sm md:text-base">
                        {monthName}
                      </Text>
                    </div>
                    
                    <div className="mt-3">
                      {submissionStatus.submitted ? (
                        <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <Text strong className="text-green-700 text-xs">
                              Data Submitted
                            </Text>
                          </div>
                          <Text type="secondary" className="text-xs block text-center">
                            By: {submissionStatus.submittedBy}
                          </Text>
                        </div>
                      ) : (
                        <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <Text strong className="text-yellow-700 text-xs">
                              No Data Submitted
                            </Text>
                          </div>
                        </div>
                      )}
                    </div>

                    <Row gutter={[8, 8]} className="mt-3">
                      <Col span={12}>
                        <div className="text-center">
                          <div className="text-lg md:text-xl font-bold text-blue-600">
                            {currentAssembly.members.length}
                          </div>
                          <Text type="secondary" className="text-xs">
                            Total
                          </Text>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="text-center">
                          <div className="text-lg md:text-xl font-bold text-green-600">
                            {getTableData.length}
                          </div>
                          <Text type="secondary" className="text-xs">
                            Showing
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <Text className="text-slate-600 text-sm">Assembly Code</Text>
                    <Tag color="blue" className="!font-semibold !text-xs">
                      {selectedAssembly.substring(0, 3).toUpperCase()}
                    </Tag>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <Text className="text-slate-600 text-sm">Sort Order</Text>
                    <Button
                      size="small"
                      onClick={toggleSortOrder}
                      icon={sortOrder === "asc" ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
                      className="!px-2 !py-1"
                    >
                      {sortOrder === "asc" ? "ASC" : "DESC"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="shadow-lg border-0 rounded-xl md:rounded-2xl bg-white mt-4">
            <Title level={5} className="!mb-3 !text-slate-700">Quick Stats</Title>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Statistic
                    title={<Text className="text-xs">Submissions</Text>}
                    value={stats.submissionsCount}
                    prefix={<DatabaseOutlined className="text-blue-500" />}
                    valueStyle={{ fontSize: screens.xs ? "16px" : "20px", color: "#1890ff" }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="p-2 bg-green-50 rounded-lg">
                  <Statistic
                    title={<Text className="text-xs">Total Tithe</Text>}
                    value={stats.totalAmount}
                    prefix="₦"
                    precision={0}
                    valueStyle={{ fontSize: screens.xs ? "16px" : "20px", color: "#059669" }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Statistic
                    title={<Text className="text-xs">Paid</Text>}
                    value={currentAssemblyStats.paidMembers}
                    valueStyle={{ fontSize: screens.xs ? "16px" : "20px", color: "#7c3aed" }}
                  />
                </div>
              </Col>
              <Col span={12}>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Statistic
                    title={<Text className="text-xs">Unpaid</Text>}
                    value={currentAssemblyStats.unpaidMembers}
                    valueStyle={{ fontSize: screens.xs ? "16px" : "20px", color: "#ea580c" }}
                  />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Panel - Handsontable */}
        <Col xs={24} lg={18}>
          <Card className="shadow-lg border-0 rounded-xl md:rounded-2xl bg-white h-full">
            {/* Table Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="hidden sm:block p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                  <EyeOutlined className="text-lg" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Title level={screens.xs ? 5 : 3} className="!mb-0 !text-slate-800">
                      {selectedAssembly || "Select Assembly"}
                    </Title>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <Text type="secondary" className="text-sm md:text-base">
                      {monthName}
                    </Text>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Tag color="blue" className="!rounded-full !text-xs">
                      {getTableData.length} records
                    </Tag>
                    {submissionStatus.submitted ? (
                      <Tag color="green" className="!rounded-full !text-xs">
                        Submitted ✓
                      </Tag>
                    ) : (
                      <Tag color="orange" className="!rounded-full !text-xs">
                        Not Submitted
                      </Tag>
                    )}
                    {searchText && (
                      <Tag
                        closable
                        onClose={handleClearSearch}
                        color="orange"
                        className="!rounded-full !text-xs"
                      >
                        Search: "{searchText}"
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              <Space size={screens.xs ? "small" : "middle"} className="mt-2 sm:mt-0">
                <Button
                  size={screens.xs ? "small" : "middle"}
                  icon={<FileExcelOutlined />}
                  onClick={exportToExcel}
                  disabled={getTableData.length === 0}
                >
                  {screens.xs ? "Excel" : "Export Excel"}
                </Button>
                <Button
                  size={screens.xs ? "small" : "middle"}
                  icon={<SyncOutlined />}
                  onClick={refreshData}
                  loading={loading}
                >
                  {screens.xs ? "Refresh" : "Refresh Data"}
                </Button>
              </Space>
            </div>

            {/* Info Alert */}
            <Alert
              message="Admin View - Read Only"
              description="This view displays tithe data submitted by churches."
              type="info"
              showIcon
              className="mb-3 rounded-lg text-xs"
            />

            {/* Handsontable Component */}
            {loading ? (
              <div className="flex flex-col justify-center items-center py-16">
                <Spin size="large" />
                <Text className="mt-3 text-slate-600">Loading tithe data...</Text>
              </div>
            ) : getTableData.length === 0 ? (
              <Empty
                description={
                  <div className="text-center">
                    <div className="text-base font-semibold text-slate-700 mb-2">
                      No data available
                    </div>
                    <Text type="secondary" className="text-sm">
                      {searchText
                        ? `No records match "${searchText}"`
                        : submissionStatus.submitted
                        ? "No data submitted for this month"
                        : "Select an assembly and month to view data"}
                    </Text>
                  </div>
                }
                className="py-12"
                image={
                  <div className="mb-3">
                    <div className="inline-flex p-3 bg-blue-50 rounded-full">
                      <Users className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
                    </div>
                  </div>
                }
              />
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <HotTable
                  ref={hotRef}
                  data={getTableData}
                  colHeaders={colHeaders}
                  columns={columns}
                  stretchH="all"
                  rowHeaders={true}
                  licenseKey="non-commercial-and-evaluation"
                  height={tableHeight}
                  manualColumnResize={true}
                  multiColumnSorting={true}
                  readOnly={true}
                  className="custom-handsontable admin-view"
                  autoWrapRow={true}
                  maxRows={getTableData.length}
                  viewportRowRenderingOffset={20}
                  renderAllRows={true}
                />
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Row justify="space-between" align="middle">
                <Col>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <Text className="text-xs">Assembly</Text>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <Text className="text-xs">Read-Only</Text>
                    </div>
                  </div>
                </Col>
                <Col>
                  <Text type="secondary" className="text-xs">
                    {submissionStatus.submitted
                      ? `Last update: ${moment(submissionStatus.submittedDate).format("DD/MM/YY HH:mm")}`
                      : "No data submitted"}
                  </Text>
                </Col>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Mobile Bottom Actions */}
      {screens.xs && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 shadow-lg z-10">
          <Row gutter={8}>
            <Col span={12}>
              <Button
                type="primary"
                block
                size="small"
                icon={<FileExcelOutlined />}
                onClick={exportToExcel}
                disabled={getTableData.length === 0}
              >
                Export
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                size="small"
                icon={<SyncOutlined />}
                onClick={refreshData}
                loading={loading}
              >
                Refresh
              </Button>
            </Col>
          </Row>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .custom-handsontable {
          font-size: ${screens.xs ? "11px" : "13px"};
        }

        .custom-handsontable.admin-view {
          cursor: not-allowed;
        }

        .custom-handsontable .ht_clone_top th {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
          color: #475569 !important;
          font-weight: 600 !important;
          border-color: #cbd5e1 !important;
          text-align: center !important;
          padding: 6px 3px !important;
          font-size: ${screens.xs ? "11px" : "12px"};
        }

        .custom-handsontable td {
          border-color: #f1f5f9 !important;
          padding: 6px 3px !important;
          background-color: #fafafa !important;
          font-size: ${screens.xs ? "11px" : "13px"};
        }

        .custom-handsontable .htBold {
          font-weight: bold !important;
          color: #059669 !important;
        }

        .custom-handsontable .htCenter {
          text-align: center !important;
        }

        .custom-handsontable .handsontable tbody tr:hover td {
          background-color: #f0f9ff !important;
        }

        /* Ensure table fills available space */
        .handsontable {
          min-height: 400px !important;
        }

        /* Mobile optimizations */
        @media (max-width: 768px) {
          .ant-card {
            border-radius: 12px !important;
          }
          
          .ant-card-body {
            padding: 16px !important;
          }
          
          .handsontable {
            overflow-x: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ChurchMembersDirectory;