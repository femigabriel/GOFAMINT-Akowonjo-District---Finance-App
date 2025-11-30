// components/dashboard/FinancialReportsManager.tsx
"use client";

import { useState } from "react";
import {
  Card,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Form,
  Space,
  Alert,
  Modal,
  Checkbox,
  Divider,
  Typography,
  Grid,
} from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
  DownloadOutlined,
  CalendarOutlined,
  TeamOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import moment from "moment";
import { format } from "date-fns";

const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { MonthPicker } = DatePicker;

interface ReportConfig {
  serviceTypes: string[];
  startDate: moment.Moment | null;
  endDate: moment.Moment | null;
  format: 'excel' | 'pdf';
  includeDetails: boolean;
  includeSummaries: boolean;
}

const FinancialReportsManager: React.FC = () => {
  const { assembly } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const screens = useBreakpoint();

  const initialConfig: ReportConfig = {
    serviceTypes: ['sunday', 'midweek', 'special'],
    startDate: moment().startOf('month'),
    endDate: moment().endOf('month'),
    format: 'excel',
    includeDetails: true,
    includeSummaries: true,
  };

  const serviceTypeOptions = [
    { value: 'sunday', label: 'Sunday Services', icon: <CalendarOutlined /> },
    { value: 'midweek', label: 'Midweek Services', icon: <TeamOutlined /> },
    { value: 'special', label: 'Special Services', icon: <StarOutlined /> },
  ];

  const handleGenerateReport = async (values: ReportConfig) => {
    if (!assembly) {
    //   Alert.error('No assembly selected');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        assembly,
        serviceTypes: values.serviceTypes,
        startDate: values.startDate?.format('YYYY-MM-DD'),
        endDate: values.endDate?.format('YYYY-MM-DD'),
        format: values.format,
        includeDetails: values.includeDetails,
        includeSummaries: values.includeSummaries,
      };

      console.log('Generating report with config:', payload);

      const response = await fetch('/api/financial-reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const filename = `Financial-Report-${assembly}-${format(new Date(), 'yyyy-MM-dd')}.${values.format}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setConfigModalVisible(false);

    } catch (error: any) {
      console.error('Report generation failed:', error);
    //   Alert.error(`Failed to generate report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const openConfigModal = () => {
    form.setFieldsValue(initialConfig);
    setConfigModalVisible(true);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <FileExcelOutlined className="text-white text-lg" />
          </div>
          <div>
            <Title level={3} className="!mb-1 !text-gray-800">
              Financial Reports Generator
            </Title>
            <Text className="text-gray-500">
              Generate comprehensive financial reports for district submissions
            </Text>
          </div>
        </div>
      </div>

      {/* Quick Stats & Info */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={8}>
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarOutlined className="text-blue-500 text-xl" />
              <div>
                <Text strong className="text-gray-800">Sunday Services</Text>
                <br />
                <Text type="secondary" className="text-sm">
                  Weekly attendance & offerings
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <div className="flex items-center gap-3">
              <TeamOutlined className="text-green-500 text-xl" />
              <div>
                <Text strong className="text-gray-800">Midweek Services</Text>
                <br />
                <Text type="secondary" className="text-sm">
                  Tuesday & Thursday reports
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <div className="flex items-center gap-3">
              <StarOutlined className="text-purple-500 text-xl" />
              <div>
                <Text strong className="text-gray-800">Special Services</Text>
                <br />
                <Text type="secondary" className="text-sm">
                  Programs & special events
                </Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Action Section */}
      <Card 
        title="Generate Financial Report" 
        className="shadow-sm border-0 bg-gradient-to-r from-blue-50 to-indigo-50"
      >
        <div className="text-center py-8">
          <FileExcelOutlined className="text-4xl text-blue-600 mb-4" />
          <Title level={4} className="!text-gray-800 !mb-2">
            Professional Financial Reports
          </Title>
          <Text className="text-gray-600 mb-6 block">
            Generate comprehensive Excel or PDF reports for district submissions. 
            Includes detailed breakdowns, summaries, and professional formatting.
          </Text>
          
          <Space 
            direction={screens.xs ? "vertical" : "horizontal"} 
            size="large"
            className="w-full justify-center"
          >
            <Button
              type="primary"
              size="large"
              icon={<FileExcelOutlined />}
              onClick={openConfigModal}
              className="bg-green-600 hover:bg-green-700 border-0 h-12 px-6 rounded-lg font-semibold"
            >
              Generate Excel Report
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<FilePdfOutlined />}
              onClick={openConfigModal}
              className="bg-red-600 hover:bg-red-700 border-0 h-12 px-6 rounded-lg font-semibold"
            >
              Generate PDF Report
            </Button>
          </Space>
        </div>
      </Card>

      {/* Configuration Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <DownloadOutlined className="text-blue-600" />
            <span>Configure Financial Report</span>
          </div>
        }
        open={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
        footer={null}
        width={screens.xs ? 350 : 600}
        className="rounded-lg"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={initialConfig}
          onFinish={handleGenerateReport}
          size={screens.xs ? "small" : "middle"}
        >
          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {/* Service Types Selection */}
            <Form.Item
              name="serviceTypes"
              label="Include Service Types"
              rules={[{ required: true, message: 'Please select at least one service type' }]}
            >
              <Checkbox.Group className="w-full">
                <Row gutter={[8, 8]}>
                  {serviceTypeOptions.map(option => (
                    <Col xs={24} sm={8} key={option.value}>
                      <Checkbox value={option.value} className="w-full">
                        <Space>
                          {option.icon}
                          <span className={screens.xs ? "text-sm" : ""}>
                            {option.label}
                          </span>
                        </Space>
                      </Checkbox>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            <Divider className="my-4" />

            {/* Date Range */}
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="startDate"
                  label="Start Date"
                  rules={[{ required: true, message: 'Please select start date' }]}
                >
                  <MonthPicker
                    className="w-full rounded-lg"
                    placeholder="Start month"
                    format="MMM YYYY"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="endDate"
                  label="End Date"
                  rules={[{ required: true, message: 'Please select end date' }]}
                >
                  <MonthPicker
                    className="w-full rounded-lg"
                    placeholder="End month"
                    format="MMM YYYY"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider className="my-4" />

            {/* Report Format */}
            <Form.Item
              name="format"
              label="Report Format"
              rules={[{ required: true, message: 'Please select format' }]}
            >
              <Select className="w-full rounded-lg">
                <Option value="excel">
                  <Space>
                    <FileExcelOutlined className="text-green-600" />
                    <span>Excel (.xlsx) - Recommended for analysis</span>
                  </Space>
                </Option>
                <Option value="pdf">
                  <Space>
                    <FilePdfOutlined className="text-red-600" />
                    <span>PDF (.pdf) - Recommended for printing</span>
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            <Divider className="my-4" />

            {/* Report Options */}
            <Form.Item
              name="includeDetails"
              valuePropName="checked"
              className="mb-2"
            >
              <Checkbox>Include detailed breakdowns</Checkbox>
            </Form.Item>
            <Form.Item
              name="includeSummaries"
              valuePropName="checked"
            >
              <Checkbox>Include summary reports</Checkbox>
            </Form.Item>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
            <Button 
              onClick={() => setConfigModalVisible(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<DownloadOutlined />}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Generate Report
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default FinancialReportsManager;