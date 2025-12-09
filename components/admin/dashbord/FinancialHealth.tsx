import { Card, Progress, List, Tag, Alert, Row, Col, Statistic } from 'antd';
import { LineChartOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';

interface FinancialHealthProps {
  data: {
    tithePercentage: string;
    financialHealthScore: number;
    recommendations: string[];
  };
}

export default function FinancialHealth({ data }: FinancialHealthProps) {
  const getHealthColor = (score: number) => {
    if (score >= 8) return '#52c41a';
    if (score >= 6) return '#1890ff';
    if (score >= 4) return '#faad14';
    return '#ff4d4f';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <Card title="Financial Health Analysis" style={{ borderRadius: 8 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card size="small">
            <Statistic
              title="Health Score"
              value={data.financialHealthScore}
              suffix="/10"
              prefix={<LineChartOutlined />}
              valueStyle={{ color: getHealthColor(data.financialHealthScore), fontSize: 32 }}
            />
            <Progress 
              percent={data.financialHealthScore * 10} 
              strokeColor={getHealthColor(data.financialHealthScore)}
              showInfo={false}
              style={{ marginTop: 8 }}
            />
            <Tag color={data.financialHealthScore >= 6 ? 'success' : 'warning'} style={{ marginTop: 8 }}>
              {getHealthStatus(data.financialHealthScore)}
            </Tag>
          </Card>
        </Col>
        
        <Col span={24}>
          <Card size="small" title="Tithe Performance">
            <Progress 
              percent={parseFloat(data.tithePercentage)} 
              strokeColor="#1890ff"
              format={(percent) => `${percent?.toFixed(1)}%`}
            />
            <Alert
              message="Target: 15%"
              type="info"
              showIcon
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        
        <Col span={24}>
          <List
            header={<strong>Recommendations</strong>}
            dataSource={data.recommendations}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Tag color={index < 2 ? 'blue' : 'default'}>
                      <CheckCircleOutlined /> Priority {index + 1}
                    </Tag>
                  }
                  description={item}
                />
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </Card>
  );
}