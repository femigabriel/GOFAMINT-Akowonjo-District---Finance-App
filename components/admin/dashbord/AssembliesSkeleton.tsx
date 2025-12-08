"use client";

import { Skeleton, Card, Row, Col } from "antd";

export const AssembliesSkeleton = () => {
  return (
    <div className="p-4 md:p-6">
      {/* Filters Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Skeleton.Input active size="large" block />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Skeleton.Input active size="large" block />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Skeleton.Input active size="large" block />
          </Card>
        </Col>
      </Row>

      {/* Summary boxes */}
      <Row gutter={[16, 16]} className="mt-4">
        {[1, 2, 3].map((i) => (
          <Col key={i} xs={24} md={8}>
            <Card className="h-[120px] flex items-center">
              <Skeleton active paragraph={false} title={{ width: "60%" }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table Skeleton */}
      <Card className="mt-6">
        <Skeleton
          active
          title={{ width: "40%" }}
          paragraph={{ rows: 10 }}
        />
      </Card>
    </div>
  );
};
