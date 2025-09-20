"use client";

import { Card, Typography } from "antd";

const { Title, Text } = Typography;

export default function DashboardPage() {
  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
      <Card className="shadow-md rounded-xl">
        <Title level={4}>Weekly Offerings</Title>
        <Text className="text-2xl font-bold">₦150,000</Text>
      </Card>

      <Card className="shadow-md rounded-xl">
        <Title level={4}>Monthly Tithe</Title>
        <Text className="text-2xl font-bold">₦320,000</Text>
      </Card>

      <Card className="shadow-md rounded-xl">
        <Title level={4}>Total Submissions</Title>
        <Text className="text-2xl font-bold">₦470,000</Text>
      </Card>
    </div>
  );
}
