import { Table, Tag, Progress, Row, Col, Card, Statistic } from 'antd';
import { RiseOutlined, DollarOutlined, UserOutlined } from '@ant-design/icons';

interface AssemblyPerformanceProps {
  data: Array<{
    assembly: string;
    totalIncome: number;
    totalAttendance: number;
    performanceRating: string;
    incomePerAttendee: number;
  }>;
}

export default function AssemblyPerformance({ data }: AssemblyPerformanceProps) {
  const columns = [
    {
      title: 'Assembly',
      dataIndex: 'assembly',
      key: 'assembly',
      sorter: (a: any, b: any) => a.assembly.localeCompare(b.assembly),
    },
    {
      title: 'Income',
      dataIndex: 'totalIncome',
      key: 'totalIncome',
      sorter: (a: any, b: any) => a.totalIncome - b.totalIncome,
      render: (value: number) => (
        <Statistic
          value={value}
          prefix="₦"
          valueStyle={{ fontSize: 14 }}
        />
      ),
    },
    {
      title: 'Attendance',
      dataIndex: 'totalAttendance',
      key: 'totalAttendance',
      sorter: (a: any, b: any) => a.totalAttendance - b.totalAttendance,
    },
    {
      title: 'Rating',
      dataIndex: 'performanceRating',
      key: 'performanceRating',
      render: (rating: string) => {
        let color = 'default';
        if (rating === 'Excellent') color = 'success';
        if (rating === 'Good') color = 'processing';
        if (rating === 'Average') color = 'warning';
        return <Tag color={color}>{rating}</Tag>;
      },
    },
    {
      title: 'Per Attendee',
      dataIndex: 'incomePerAttendee',
      key: 'incomePerAttendee',
      render: (value: number) => `₦${Math.round(value)}`,
    },
  ];

  return (
    <Card title="Assembly Performance" style={{ borderRadius: 8 }}>
      <Table
        columns={columns}
        dataSource={data.map((item, index) => ({ ...item, key: index }))}
        pagination={false}
        size="small"
      />
      
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Top Performer"
              value={data[0]?.assembly || 'N/A'}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Highest Income"
              value={data[0]?.totalIncome || 0}
              prefix={<DollarOutlined />}
              formatter={(value) => `₦${(value as number).toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="Most Attended"
              value={data.reduce((max, item) => 
                item.totalAttendance > max.totalAttendance ? item : max
              )?.assembly || 'N/A'}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
}