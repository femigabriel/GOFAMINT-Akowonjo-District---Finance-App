// components/FinancialRecordsDisplay.tsx
'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  Button, 
  Card, 
  Row, 
  Col, 
  Space, 
  Spin,
  Grid,
  DatePicker,
  notification,
  Modal,
  Input
} from 'antd';
import { 
  FileExcelOutlined, 
  FilePdfOutlined, 
  SaveOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import { useAuth } from "@/context/AuthContext";
import moment from 'moment';

const { useBreakpoint } = Grid;
const { MonthPicker } = DatePicker;

interface FinancialRecord {
  _id?: string;
  assembly: string;
  month: string;
  submittedBy: string;
  records: Array<{
    date: string;
    description: string;
    category: string;
    type: 'income' | 'expense';
    amount: number;
    paymentMethod?: string;
    reference?: string;
  }>;
  totals: {
    income: number;
    expense: number;
    net: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

interface FinancialRecordsDisplayProps {
  assembly: string | null;
}

export default function FinancialRecordsDisplay({ assembly }: FinancialRecordsDisplayProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [financialData, setFinancialData] = useState<FinancialRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submittedBy, setSubmittedBy] = useState('');
  const screens = useBreakpoint();

  const monthKey = (date: Date) => format(date, 'MMMM-yyyy');

  useEffect(() => {
    fetchFinancialData();
  }, [currentMonth, assembly]);

  const fetchFinancialData = async () => {
    if (!assembly) {
      setFinancialData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const month = monthKey(currentMonth);
      const response = await fetch(
        `/api/financial-records?assembly=${encodeURIComponent(assembly)}&month=${month}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setFinancialData(data);
      } else {
        setFinancialData(null);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
      notification.error({
        message: 'Load Error',
        description: 'Failed to load financial records'
      });
      setFinancialData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!assembly) {
      notification.error({ 
        message: 'No Assembly', 
        description: 'Please select an assembly first' 
      });
      return;
    }
    setIsModalOpen(true);
  };

  const confirmSave = async () => {
    if (!financialData?.records.length) {
      notification.error({ 
        message: 'No Data', 
        description: 'No financial records to save' 
      });
      return;
    }

    if (!submittedBy.trim()) {
      notification.error({ 
        message: 'Missing Information', 
        description: 'Please enter your name' 
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/financial-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assembly,
          submittedBy: submittedBy.trim(),
          month: monthKey(currentMonth),
          records: financialData.records
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      notification.success({
        message: 'Successfully Saved!',
        description: `Financial records for ${format(currentMonth, 'MMMM yyyy')} have been saved.`,
      });

      setIsModalOpen(false);
      setSubmittedBy('');
      fetchFinancialData();

    } catch (error: any) {
      console.error('Save error:', error);
      notification.error({ 
        message: 'Save Failed', 
        description: error.message || 'Failed to save financial records' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    Modal.confirm({
      title: 'Clear All Records?',
      content: 'This will remove all financial records for this month. This action cannot be undone.',
      okText: 'Yes, Clear All',
      cancelText: 'Cancel',
      okButtonProps: { danger: true },
      onOk: () => {
        setFinancialData(null);
        notification.success({ message: 'Records cleared' });
      },
    });
  };

  const exportToCSV = () => {
    if (!financialData?.records.length) {
      notification.warning({ message: 'No data to export' });
      return;
    }
    
    setExporting(true);
    
    try {
      const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Payment Method', 'Reference'];
      const csvData = financialData.records.map(record => [
        record.date,
        `"${record.description.replace(/"/g, '""')}"`,
        record.category,
        record.type,
        record.amount.toString(),
        record.paymentMethod || '',
        record.reference || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-records-${monthKey(currentMonth)}-${assembly}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notification.success({ 
        message: 'Export Successful', 
        description: 'Financial records exported to CSV' 
      });
    } catch (error) {
      notification.error({ 
        message: 'Export Failed', 
        description: 'Failed to export financial records' 
      });
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = () => {
    if (!financialData?.records.length) {
      notification.warning({ message: 'No data to export' });
      return;
    }
    
    const printContent = document.getElementById('financial-records-content');
    if (printContent) {
      const originalContents = document.body.innerHTML;
      const printContents = printContent.innerHTML;
      
      document.body.innerHTML = printContents;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  const handleMonthChange = (date: moment.Moment | null) => {
    if (date) {
      setCurrentMonth(date.toDate());
    }
  };

  if (!assembly) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-gray-400 text-6xl mb-4">💼</div>
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Assembly Selected</h3>
        <p className="text-gray-500">Please select an assembly to view financial records</p>
      </div>
    );
  }

  return (
    <div id="financial-records-content" className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-100">
      {/* Header with Controls */}
      <div className="flex flex-col gap-4 sm:gap-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <CalendarOutlined className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Financial Records
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {format(currentMonth, 'MMMM yyyy')} • {assembly}
              </p>
            </div>
          </div>

          <MonthPicker
            value={moment(currentMonth)}
            onChange={handleMonthChange}
            className="rounded-lg w-full sm:w-48"
            size={screens.xs ? 'small' : 'middle'}
            allowClear={false}
            placeholder="Select month"
          />
        </div>

        {/* Summary Cards */}
        {financialData && (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={8}>
              <Card
                className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md border-0"
                bodyStyle={{ padding: screens.xs ? '16px 12px' : '20px' }}
              >
                <div className="text-center">
                  <div className="text-green-100 text-sm font-semibold mb-2">Total Income</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    ₦{financialData.totals.income.toLocaleString()}
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={8}>
              <Card
                className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-md border-0"
                bodyStyle={{ padding: screens.xs ? '16px 12px' : '20px' }}
              >
                <div className="text-center">
                  <div className="text-red-100 text-sm font-semibold mb-2">Total Expenses</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    ₦{financialData.totals.expense.toLocaleString()}
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={8}>
              <Card
                className={`bg-gradient-to-r ${
                  financialData.totals.net >= 0 
                    ? 'from-blue-500 to-blue-600' 
                    : 'from-orange-500 to-orange-600'
                } text-white rounded-xl shadow-md border-0`}
                bodyStyle={{ padding: screens.xs ? '16px 12px' : '20px' }}
              >
                <div className="text-center">
                  <div className="text-blue-100 text-sm font-semibold mb-2">Net Total</div>
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    ₦{financialData.totals.net.toLocaleString()}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="text-sm text-gray-500">
          {financialData?.submittedBy && (
            <span>Submitted by: <strong>{financialData.submittedBy}</strong></span>
          )}
        </div>
        
        <Space wrap size={[8, 8]} className="flex justify-end gap-2">
          <Button
            icon={<FileExcelOutlined />}
            onClick={exportToCSV}
            loading={exporting}
            size={screens.xs ? 'small' : 'middle'}
            className="bg-green-600 text-white hover:bg-green-700 rounded-lg"
          >
            {screens.sm && 'CSV'}
          </Button>
          
          <Button
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            loading={exporting}
            size={screens.xs ? 'small' : 'middle'}
            className="bg-red-600 text-white hover:bg-red-700 rounded-lg"
          >
            {screens.sm && 'PDF'}
          </Button>
          
          <Button
            icon={<ReloadOutlined />}
            onClick={handleClear}
            size={screens.xs ? 'small' : 'middle'}
            danger
            className="rounded-lg"
          >
            {screens.sm && 'Clear'}
          </Button>
          
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            size={screens.xs ? 'small' : 'middle'}
            className="bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            {screens.sm && 'Save'}
          </Button>
        </Space>
      </div>

      {/* Records Table */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 rounded-lg">
            <Spin size="large" tip="Loading financial records..." />
          </div>
        )}

        {!financialData?.records.length ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-gray-400 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Financial Records</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              No financial records found for {format(currentMonth, 'MMMM yyyy')}. 
              Start by adding income and expense records.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {financialData.records.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {record.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                      {record.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.category}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {record.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                      <span className={record.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        ₦{record.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.paymentMethod || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Modal */}
      <Modal
        title="Save Financial Records"
        open={isModalOpen}
        onOk={confirmSave}
        onCancel={() => {
          setIsModalOpen(false);
          setSubmittedBy('');
        }}
        okText="Save Records"
        cancelText="Cancel"
        okButtonProps={{ 
          loading, 
          className: 'bg-blue-600 hover:bg-blue-700 rounded-lg h-10' 
        }}
        width={screens.xs ? 350 : 500}
      >
        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Submitted By <span className="text-red-500">*</span>
            </label>
            <Input
              value={submittedBy}
              onChange={(e) => setSubmittedBy(e.target.value)}
              placeholder="Enter your full name"
              prefix={<UserOutlined />}
              size="large"
            />
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Summary for {format(currentMonth, 'MMMM yyyy')}:</strong><br />
              • {financialData?.records.length || 0} records<br />
              • Total Income: ₦{financialData?.totals.income.toLocaleString() || '0'}<br />
              • Total Expenses: ₦{financialData?.totals.expense.toLocaleString() || '0'}<br />
              • Net: ₦{financialData?.totals.net.toLocaleString() || '0'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #financial-records-content,
          #financial-records-content * {
            visibility: visible;
          }
          #financial-records-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}