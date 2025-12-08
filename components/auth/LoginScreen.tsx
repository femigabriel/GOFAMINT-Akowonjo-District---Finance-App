// app/login/page.tsx
"use client";

import { useState } from "react";
import { Form, Select, Input, Button, message } from "antd";
import { Lock, Church, UserCog } from "lucide-react";
import Image from "next/image";
import { assemblies } from "@/lib/assemblies";
import { useAuth } from "@/context/AuthContext";

const { Option } = Select;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { login } = useAuth();

  const onAssemblyLogin = async (values: { assembly: string; password: string }) => {
    setLoading(true);
    await login(values.assembly, values.password);
    setLoading(false);
  };

  const onAdminLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      if (
        values.email === "admin@gofamintakowonjo_dst.com" &&
        values.password === "password"
      ) {
        localStorage.setItem("admin", "true");
        message.success("Admin login successful!");
        window.location.href = "/admin/dashboard"; 
      } else {
        message.error("Invalid admin credentials");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary via-background to-secondary/20 p-4 sm:p-6 overflow-hidden">
      <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-card p-6 sm:p-8 md:p-10">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Image
              src="/images/Gofamint_logo.png"
              alt="GOFAMINT Logo"
              width={100}
              height={100}
              className="rounded-full object-contain border-4 border-secondary/20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mt-4">
            GOFAMINT Finance
          </h1>
          <p className="text-gray-600 mt-1 text-base sm:text-lg font-medium">
            Akowonjo District
          </p>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            {isAdmin
              ? "Admin access for finance management"
              : "Secure access for assembly finance management"}
          </p>
        </div>

        {!isAdmin ? (
          <Form
            name="assembly-login"
            layout="vertical"
            onFinish={onAssemblyLogin}
            className="space-y-4"
          >
            <Form.Item
              label={
                <span className="flex items-center gap-2 text-primary font-semibold">
                  <Church className="w-4 h-4 sm:w-5 sm:h-5" />
                  Assembly
                </span>
              }
              name="assembly"
              rules={[{ required: true, message: "Please select your assembly" }]}
            >
            <Select
  placeholder="Select your assembly"
  size="large"
  className="w-full"
  showSearch
  optionFilterProp="children"
  aria-label="Select your assembly"
  classNames={{
    popup: {
      root: "rounded-lg", 
    },
  }}
>
  {assemblies.map((assembly) => (
    <Option key={assembly} value={assembly}>
      {assembly}
    </Option>
  ))}
</Select>

            </Form.Item>

            <Form.Item
              label={
                <span className="flex items-center gap-2 text-primary font-semibold">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  Password
                </span>
              }
              name="password"
              rules={[{ required: true, message: "Please enter the password" }]}
            >
              <Input.Password
                size="large"
                placeholder="Enter password"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg h-10 sm:h-12"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            name="admin-login"
            layout="vertical"
            onFinish={onAdminLogin}
            className="space-y-4"
          >
            <Form.Item
              label={
                <span className="flex items-center gap-2 text-primary font-semibold">
                  <UserCog className="w-4 h-4 sm:w-5 sm:h-5" />
                  Admin Email
                </span>
              }
              name="email"
              rules={[{ required: true, message: "Please enter your email" }]}
            >
              <Input size="large" placeholder="Enter admin email" />
            </Form.Item>

            <Form.Item
              label={
                <span className="flex items-center gap-2 text-primary font-semibold">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                  Password
                </span>
              }
              name="password"
              rules={[{ required: true, message: "Please enter your password" }]}
            >
              <Input.Password size="large" placeholder="Enter password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg h-10 sm:h-12"
              >
                Admin Sign In
              </Button>
            </Form.Item>
          </Form>
        )}

        <div className="text-center mt-4 sm:mt-6">
          {!isAdmin ? (
            <p className="text-gray-500 text-xs sm:text-sm">
              Are you an admin?{" "}
              <button
                onClick={() => setIsAdmin(true)}
                className="text-primary font-semibold hover:underline"
              >
                Login here
              </button>
            </p>
          ) : (
            <p className="text-gray-500 text-xs sm:text-sm">
              Back to{" "}
              <button
                onClick={() => setIsAdmin(false)}
                className="text-primary font-semibold hover:underline"
              >
                Assembly Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}