"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  Input, 
  Table, 
  Tag, 
  Select, 
  Space, 
  Button, 
  Row, 
  Col,
  Typography,
  Avatar,
  Empty,
  Spin
} from "antd";
import { 
  SearchOutlined, 
  FilterOutlined,
  UserOutlined,
  TeamOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { titheData } from "@/lib/tithe-data";
import { Church } from 'lucide-react';

const { Title, Text } = Typography;

interface Member {
  sn: number;
  name: string;
  assembly: string;
}

interface AssemblyData {
  assembly: string;
  members: Array<{ sn: number; name: string }>;
}

const AdminMembersPage = () => {
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedAssembly, setSelectedAssembly] = useState<string>("all");
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);

  // Fetch all members from titheData
  useEffect(() => {
    fetchAllMembers();
  }, []);

  const fetchAllMembers = () => {
    setLoading(true);
    try {
      const membersList: Member[] = [];
      
      // Flatten all assembly data into one array
      titheData.forEach((assembly: AssemblyData) => {
        assembly.members.forEach(member => {
          membersList.push({
            sn: member.sn,
            name: member.name,
            assembly: assembly.assembly
          });
        });
      });
      
      setAllMembers(membersList);
      setFilteredMembers(membersList);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters whenever search or assembly selection changes
  useEffect(() => {
    let result = [...allMembers];

    // Apply assembly filter
    if (selectedAssembly !== "all") {
      result = result.filter(member => 
        member.assembly === selectedAssembly
      );
    }

    // Apply search filter
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(member =>
        member.name.toLowerCase().includes(searchLower) ||
        member.assembly.toLowerCase().includes(searchLower)
      );
    }

    setFilteredMembers(result);
  }, [searchText, selectedAssembly, allMembers]);

  // Get unique assemblies for filter dropdown
  const assemblies = useMemo(() => {
    const uniqueAssemblies = [...new Set(titheData.map(item => item.assembly))];
    return uniqueAssemblies;
  }, []);

  // Get statistics
  const stats = useMemo(() => {
    const totalMembers = allMembers.length;
    const totalAssemblies = assemblies.length;
    
    return {
      totalMembers,
      totalAssemblies,
      filteredCount: filteredMembers.length
    };
  }, [allMembers, assemblies, filteredMembers]);

  const handleResetFilters = () => {
    setSearchText("");
    setSelectedAssembly("all");
  };

  const columns = [
    {
      title: 'SN',
      dataIndex: 'sn',
      key: 'sn',
      width: 80,
      align: 'center' as const,
      sorter: (a: Member, b: Member) => a.sn - b.sn,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: any, record: Member) => (
        <div className="flex items-center gap-3">
          <Avatar 
            size="large" 
            icon={<UserOutlined />} 
            style={{ backgroundColor: '#1890ff' }}
          />
          <div>
            <Text strong className="block">{record.name}</Text>
            <Text type="secondary" className="text-xs">
              Member #{record.sn.toString().padStart(3, '0')}
            </Text>
          </div>
        </div>
      ),
      sorter: (a: Member, b: Member) => a.name.localeCompare(b.name),
    },
    {
      title: 'Assembly',
      dataIndex: 'assembly',
      key: 'assembly',
      render: (assembly: string) => (
        <div className="flex items-center gap-2">
          <Church className="text-blue-500" />
          <Tag color="blue">{assembly}</Tag>
        </div>
      ),
      filters: assemblies.map(assembly => ({ 
        text: assembly, 
        value: assembly 
      })),
      onFilter: (value: any, record: Member) => record.assembly === value,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Title level={2} className="!mb-2">
              <TeamOutlined className="mr-3 text-blue-600" />
              Church Members Directory
            </Title>
            <Text type="secondary">
              View all members across {assemblies.length} assemblies
            </Text>
          </div>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchAllMembers}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-sm">Total Members</Text>
                <Title level={3} className="!my-2 text-blue-600">
                  {stats.totalMembers}
                </Title>
              </div>
              <UserOutlined className="text-3xl text-blue-500" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-sm">Total Assemblies</Text>
                <Title level={3} className="!my-2 text-purple-600">
                  {stats.totalAssemblies}
                </Title>
              </div>
              <Church className="text-3xl text-purple-500" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <Text type="secondary" className="text-sm">Showing</Text>
                <Title level={3} className="!my-2 text-green-600">
                  {stats.filteredCount}
                </Title>
              </div>
              <FilterOutlined className="text-3xl text-green-500" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Title level={4} className="!mb-0">
              <FilterOutlined className="mr-2" />
              Filter Members
            </Title>
            {(searchText || selectedAssembly !== "all") && (
              <Button 
                type="link" 
                onClick={handleResetFilters}
                size="small"
              >
                Clear Filters
              </Button>
            )}
          </div>
          
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Input
                placeholder="Search by member name or assembly..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="large"
                className="w-full"
              />
            </Col>
            
            <Col xs={24} md={12}>
              <Select
                placeholder="Filter by Assembly"
                style={{ width: '100%' }}
                size="large"
                value={selectedAssembly}
                onChange={setSelectedAssembly}
                options={[
                  { label: 'All Assemblies', value: 'all' },
                  ...assemblies.map(assembly => ({ 
                    label: assembly, 
                    value: assembly 
                  }))
                ]}
              />
            </Col>
          </Row>
          
          {/* Active filters display */}
          {(searchText || selectedAssembly !== "all") && (
            <div className="flex flex-wrap gap-2 mt-2">
              {searchText && (
                <Tag closable onClose={() => setSearchText("")}>
                  Search: "{searchText}"
                </Tag>
              )}
              {selectedAssembly !== "all" && (
                <Tag 
                  closable 
                  onClose={() => setSelectedAssembly("all")}
                  color="blue"
                >
                  Assembly: {selectedAssembly}
                </Tag>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Members Table */}
      <Card 
        title={
          <div className="flex justify-between items-center">
            <span>
              Members List
              {searchText || selectedAssembly !== "all" ? (
                <Text type="secondary" className="ml-2">
                  ({stats.filteredCount} results)
                </Text>
              ) : null}
            </span>
            <Text type="secondary">
              Showing {filteredMembers.length} of {allMembers.length} members
            </Text>
          </div>
        }
        className="shadow-sm"
      >
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Spin size="large" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <Empty 
            description={
              <div>
                <div className="text-lg mb-2">No members found</div>
                {searchText || selectedAssembly !== "all" ? (
                  <Text type="secondary">
                    Try adjusting your search or filters
                  </Text>
                ) : (
                  <Text type="secondary">
                    No members loaded. Try refreshing.
                  </Text>
                )}
              </div>
            }
            className="py-20"
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredMembers.map(member => ({ ...member, key: `${member.assembly}-${member.sn}` }))}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} members`
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
      </Card>
    </div>
  );
};

export default AdminMembersPage;