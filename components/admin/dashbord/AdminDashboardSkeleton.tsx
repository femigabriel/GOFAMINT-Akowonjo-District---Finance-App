"use client";

import { Skeleton, Row, Col, Card } from "antd";

export const AdminDashboardSkeleton = () => {
  return (
    <div className="p-4 md:p-6">
      {/* Top Stats Row */}
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col key={i} xs={12} sm={12} md={6}>
            <Card className="h-[120px] flex items-center">
              <Skeleton active title={{ width: "60%" }} paragraph={false} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Middle Chart Section */}
      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} md={16}>
          <Card style={{ minHeight: 300 }}>
            <Skeleton active title={{ width: "40%" }} paragraph={{ rows: 6 }} />
          </Card>
        </Col>

        <Col xs={24} md={8}>
          <Card style={{ minHeight: 300 }}>
            <Skeleton active title={{ width: "50%" }} paragraph={{ rows: 4 }} />
          </Card>
        </Col>
      </Row>

      {/* Bottom Table */}
      <Card className="mt-6">
        <Skeleton
          active
          title={{ width: "30%" }}
          paragraph={{ rows: 8 }}
        />
      </Card>
    </div>
  );
};
