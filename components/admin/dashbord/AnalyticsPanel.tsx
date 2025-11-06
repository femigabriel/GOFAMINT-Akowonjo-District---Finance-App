// components/admin/AnalyticsPanel.tsx
"use client";

import { Card, Row, Col, Statistic, Tag, Progress, List, Alert, Timeline } from "antd";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  BarChart3, 
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  PieChart
} from "lucide-react";
import { useEffect, useState } from "react";

interface AnalyticsData {
  totalIncome: number;
  totalAttendance: number;
  assemblyCount: number;
  recordsCount: number;
  assemblyBreakdown: Array<{
    assembly: string;
    income: number;
    attendance: number;
    records: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    income: number;
    attendance: number;
  }>;
}

interface FinancialInsights {
  topPerformers: Array<{ assembly: string; income: number; growth?: number }>;
  areasOfConcern: Array<{ assembly: string; issue: string; severity: 'low' | 'medium' | 'high' }>;
  trends: Array<{ type: string; description: string; impact: 'positive' | 'negative' | 'neutral' }>;
  recommendations: Array<{ action: string; priority: 'high' | 'medium' | 'low'; reasoning: string }>;
  keyMetrics: {
    averageAttendance: number;
    averageIncome: number;
    incomeGrowth: number;
    attendanceGrowth: number;
    efficiencyRatio: number;
  };
}

export default function AnalyticsPanel({ dashboardData }: { dashboardData: any }) {
  const [insights, setInsights] = useState<FinancialInsights | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dashboardData) {
      analyzeFinancialData(dashboardData);
    }
  }, [dashboardData]);

  const analyzeFinancialData = (data: any) => {
    setLoading(true);
    
    // Simulate analysis processing
    setTimeout(() => {
      const insights = generateFinancialInsights(data);
      setInsights(insights);
      setLoading(false);
    }, 1000);
  };

  const generateFinancialInsights = (data: any): FinancialInsights => {
    const assemblies = data.assemblyBreakdown || [];
    const monthlyTrends = data.monthlyTrends || [];
    
    // Calculate key metrics
    const totalIncome = data.monthlyIncome || 0;
    const totalAttendance = data.activeMembers || 0;
    const assemblyCount = assemblies.length;
    
    const averageIncome = assemblyCount > 0 ? totalIncome / assemblyCount : 0;
    const averageAttendance = assemblyCount > 0 ? totalAttendance / assemblyCount : 0;
    
    // Calculate growth (simplified - in real app, compare with previous period)
    const incomeGrowth = calculateGrowth(monthlyTrends, 'income');
    const attendanceGrowth = calculateGrowth(monthlyTrends, 'attendance');
    
    // Efficiency ratio: Income per attendee
    const efficiencyRatio = totalAttendance > 0 ? totalIncome / totalAttendance : 0;

    // Identify top performers (top 3 by income)
    const topPerformers = assemblies
      .sort((a: any, b: any) => b.income - a.income)
      .slice(0, 3)
      .map((assembly: any) => ({
        assembly: assembly.assembly,
        income: assembly.income,
        growth: Math.random() * 20 - 5 // Simulated growth for demo
      }));

    // Identify areas of concern
    const areasOfConcern = identifyConcerns(assemblies, averageIncome, averageAttendance);

    // Generate trends
    const trends = generateTrends(incomeGrowth, attendanceGrowth, efficiencyRatio);

    // Generate recommendations
    const recommendations = generateRecommendations(assemblies, areasOfConcern, trends);

    return {
      topPerformers,
      areasOfConcern,
      trends,
      recommendations,
      keyMetrics: {
        averageAttendance: Math.round(averageAttendance),
        averageIncome: Math.round(averageIncome),
        incomeGrowth,
        attendanceGrowth,
        efficiencyRatio: Math.round(efficiencyRatio)
      }
    };
  };

  const calculateGrowth = (trends: any[], metric: string): number => {
    if (trends.length < 2) return 0;
    
    const recent = trends[trends.length - 1][metric] || 0;
    const previous = trends[trends.length - 2][metric] || 1;
    
    return ((recent - previous) / previous) * 100;
  };

  const identifyConcerns = (assemblies: any[], avgIncome: number, avgAttendance: number) => {
    const concerns = [];
    
    for (const assembly of assemblies) {
      const issues = [];
      
      if (assembly.income < avgIncome * 0.5) {
        issues.push({ issue: 'Low income generation', severity: 'high' as const });
      } else if (assembly.income < avgIncome * 0.8) {
        issues.push({ issue: 'Below average income', severity: 'medium' as const });
      }
      
      if (assembly.attendance < avgAttendance * 0.4) {
        issues.push({ issue: 'Low attendance', severity: 'high' as const });
      } else if (assembly.attendance < avgAttendance * 0.7) {
        issues.push({ issue: 'Below average attendance', severity: 'medium' as const });
      }
      
      if (assembly.records < 3) {
        issues.push({ issue: 'Inconsistent reporting', severity: 'medium' as const });
      }

      for (const issue of issues) {
        concerns.push({
          assembly: assembly.assembly,
          ...issue
        });
      }
    }
    
    return concerns.slice(0, 5); // Return top 5 concerns
  };

  const generateTrends = (incomeGrowth: number, attendanceGrowth: number, efficiency: number) => {
    const trends = [];
    
    if (incomeGrowth > 10) {
      trends.push({
        type: 'Revenue',
        description: `Strong income growth of ${incomeGrowth.toFixed(1)}%`,
        impact: 'positive' as const
      });
    } else if (incomeGrowth < -5) {
      trends.push({
        type: 'Revenue',
        description: `Income decline of ${Math.abs(incomeGrowth).toFixed(1)}% needs attention`,
        impact: 'negative' as const
      });
    }

    if (attendanceGrowth > 15) {
      trends.push({
        type: 'Attendance',
        description: `Excellent attendance growth of ${attendanceGrowth.toFixed(1)}%`,
        impact: 'positive' as const
      });
    } else if (attendanceGrowth < -10) {
      trends.push({
        type: 'Attendance',
        description: `Concerning attendance drop of ${Math.abs(attendanceGrowth).toFixed(1)}%`,
        impact: 'negative' as const
      });
    }

    if (efficiency > 5000) {
      trends.push({
        type: 'Efficiency',
        description: `High giving per member (₦${efficiency.toLocaleString()})`,
        impact: 'positive' as const
      });
    } else if (efficiency < 2000) {
      trends.push({
        type: 'Efficiency',
        description: `Low giving per member (₦${efficiency.toLocaleString()})`,
        impact: 'negative' as const
      });
    }

    return trends;
  };

  const generateRecommendations = (assemblies: any[], concerns: any[], trends: any[]) => {
    const recommendations = [];
    
    // Based on concerns
    const highConcernAssemblies = concerns.filter(c => c.severity === 'high');
    if (highConcernAssemblies.length > 0) {
      recommendations.push({
        action: `Focus support on ${highConcernAssemblies.map(c => c.assembly).join(', ')}`,
        priority: 'high' as const,
        reasoning: 'These assemblies show significant challenges in key metrics'
      });
    }

    // Based on efficiency
    const lowEfficiencyAssemblies = assemblies.filter((a: any) => {
      const efficiency = a.attendance > 0 ? a.income / a.attendance : 0;
      return efficiency < 2000;
    });
    
    if (lowEfficiencyAssemblies.length > 0) {
      recommendations.push({
        action: 'Implement stewardship programs in low-giving assemblies',
        priority: 'medium' as const,
        reasoning: `${lowEfficiencyAssemblies.length} assemblies show below-average giving per member`
      });
    }

    // Based on reporting consistency
    const inconsistentReporters = assemblies.filter((a: any) => a.records < 2);
    if (inconsistentReporters.length > 0) {
      recommendations.push({
        action: 'Improve reporting consistency across assemblies',
        priority: 'medium' as const,
        reasoning: `${inconsistentReporters.length} assemblies have sparse reporting`
      });
    }

    // General recommendations based on trends
    const negativeTrends = trends.filter(t => t.impact === 'negative');
    if (negativeTrends.length > 2) {
      recommendations.push({
        action: 'Conduct district-wide review and strategy session',
        priority: 'high' as const,
        reasoning: 'Multiple negative trends detected across key metrics'
      });
    }

    return recommendations.slice(0, 4); // Return top 4 recommendations
  };

  const getTrendIcon = (growth: number) => {
    return growth >= 0 ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-500" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'yellow';
      default: return 'blue';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  if (loading) {
    return (
      <Card title="Financial Analysis" className="border-0 shadow-lg bg-white">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Analyzing financial data...</p>
        </div>
      </Card>
    );
  }

  if (!insights) {
    return (
      <Card title="Financial Analysis" className="border-0 shadow-lg bg-white">
        <div className="text-center py-8 text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No data available for analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <Card title="Key Performance Indicators" className="border-0 shadow-lg bg-white">
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Avg. Attendance"
              value={insights.keyMetrics.averageAttendance}
              prefix={<Users size={16} className="text-blue-500" />}
              valueStyle={{ color: '#3b82f6', fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Avg. Income"
              value={insights.keyMetrics.averageIncome}
              prefix={<DollarSign size={16} className="text-green-500" />}
              formatter={(value) => `₦${Math.round(Number(value)).toLocaleString()}`}
              valueStyle={{ color: '#10b981', fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Income Growth"
              value={Math.abs(insights.keyMetrics.incomeGrowth)}
              prefix={getTrendIcon(insights.keyMetrics.incomeGrowth)}
              suffix="%"
              valueStyle={{ 
                color: insights.keyMetrics.incomeGrowth >= 0 ? '#10b981' : '#ef4444',
                fontSize: '18px' 
              }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Attendance Growth"
              value={Math.abs(insights.keyMetrics.attendanceGrowth)}
              prefix={getTrendIcon(insights.keyMetrics.attendanceGrowth)}
              suffix="%"
              valueStyle={{ 
                color: insights.keyMetrics.attendanceGrowth >= 0 ? '#10b981' : '#ef4444',
                fontSize: '18px' 
              }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Efficiency Ratio"
              value={insights.keyMetrics.efficiencyRatio}
              prefix="₦"
              suffix="/member"
              valueStyle={{ color: '#8b5cf6', fontSize: '18px' }}
            />
          </Col>
          <Col xs={12} sm={8} lg={4}>
            <Statistic
              title="Assembly Health"
              value={Math.round((insights.areasOfConcern.filter(c => c.severity === 'high').length / insights.topPerformers.length) * 100) || 0}
              suffix="%"
              valueStyle={{ color: '#f59e0b', fontSize: '18px' }}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Top Performers */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center">
                <TrendingUp size={18} className="mr-2 text-green-500" />
                <span>Top Performing Assemblies</span>
              </div>
            }
            className="border-0 shadow-lg bg-white h-full"
          >
            <List
              dataSource={insights.topPerformers}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="font-bold text-green-600">{index + 1}</span>
                      </div>
                    }
                    title={item.assembly}
                    description={
                      <div className="space-y-1">
                        <div className="font-semibold text-green-600">
                          ₦{item.income.toLocaleString()}
                        </div>
                        {item.growth && (
                          <div className={`text-xs ${item.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {item.growth >= 0 ? '+' : ''}{item.growth.toFixed(1)}% growth
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Areas of Concern */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center">
                <AlertTriangle size={18} className="mr-2 text-orange-500" />
                <span>Areas Needing Attention</span>
              </div>
            }
            className="border-0 shadow-lg bg-white h-full"
          >
            <List
              dataSource={insights.areasOfConcern}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div className="flex items-center justify-between">
                        <span>{item.assembly}</span>
                        <Tag color={getSeverityColor(item.severity)}>
                          {item.severity}
                        </Tag>
                      </div>
                    }
                    description={item.issue}
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'No major concerns detected' }}
            />
          </Card>
        </Col>

        {/* Trends & Patterns */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center">
                <BarChart3 size={18} className="mr-2 text-blue-500" />
                <span>Key Trends</span>
              </div>
            }
            className="border-0 shadow-lg bg-white h-full"
          >
            <Timeline>
              {insights.trends.map((trend, index) => (
                <Timeline.Item
                  key={index}
                  color={trend.impact === 'positive' ? 'green' : trend.impact === 'negative' ? 'red' : 'blue'}
                >
                  <div className="text-sm">
                    <div className="font-medium">{trend.type}</div>
                    <div className="text-gray-600">{trend.description}</div>
                  </div>
                </Timeline.Item>
              ))}
              {insights.trends.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No significant trends detected
                </div>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Recommendations */}
      <Card 
        title={
          <div className="flex items-center">
            <Lightbulb size={18} className="mr-2 text-yellow-500" />
            <span>Strategic Recommendations</span>
          </div>
        }
        className="border-0 shadow-lg bg-white"
      >
        <List
          dataSource={insights.recommendations}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <div className={`p-2 rounded-full ${
                    item.priority === 'high' ? 'bg-red-100' : 
                    item.priority === 'medium' ? 'bg-orange-100' : 'bg-green-100'
                  }`}>
                    <Target size={16} className={
                      item.priority === 'high' ? 'text-red-600' : 
                      item.priority === 'medium' ? 'text-orange-600' : 'text-green-600'
                    } />
                  </div>
                }
                title={
                  <div className="flex items-center justify-between">
                    <span>{item.action}</span>
                    <Tag color={getPriorityColor(item.priority)}>
                      {item.priority} priority
                    </Tag>
                  </div>
                }
                description={item.reasoning}
              />
            </List.Item>
          )}
        />
      </Card>

      {/* Summary Alert */}
      {insights.areasOfConcern.some(c => c.severity === 'high') && (
        <Alert
          message="Attention Required"
          description="High-priority issues detected in some assemblies. Review the recommendations above."
          type="warning"
          showIcon
          icon={<AlertTriangle size={16} />}
        />
      )}

      {insights.topPerformers.length > 0 && insights.areasOfConcern.length === 0 && (
        <Alert
          message="Strong Performance"
          description="All assemblies are performing well. Focus on growth initiatives."
          type="success"
          showIcon
          icon={<CheckCircle size={16} />}
        />
      )}
    </div>
  );
}