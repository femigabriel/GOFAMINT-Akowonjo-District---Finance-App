"use client";

import { useState } from "react";
import { Form, Select, Input, Button, message, Tabs, Spin } from "antd";
import { Lock, Church, UserCog } from "lucide-react";
import Image from "next/image";
import { assemblies } from "@/lib/assemblies";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { TabPane } = Tabs;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [routing, setRouting] = useState(false); // New state for routing spinner
  const [form] = Form.useForm();
  const router = useRouter();

  // Update your handleAssemblyLogin function
  const handleAssemblyLogin = async (values: any) => {
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginType: "assembly",
          ...values,
        }),
      });

      // First check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 200));
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (data.success) {
        // Save token and user data to localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.userData));
        localStorage.setItem("role", data.role);
        localStorage.setItem("assembly", data.userData.assembly);

        message.success(`Welcome, ${data.userData.assembly} Assembly!`);

        // Show routing spinner
        setRouting(true);

        // Small delay to show spinner before routing
        setTimeout(() => {
          router.push(data.redirect);
        }, 500);
      } else {
        message.error(data.message || "Invalid assembly credentials");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      message.error(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update your handleAdminLogin function
  const handleAdminLogin = async (values: any) => {
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loginType: "admin",
          ...values,
        }),
      });

      // First check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check content type to ensure it's JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 200));
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();

      if (data.success) {
        // Save token and user data to localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.userData));
        localStorage.setItem("role", data.role);
        localStorage.setItem("admin", "true"); // For backward compatibility

        message.success("Admin login successful!");

        // Show routing spinner
        setRouting(true);

        // Small delay to show spinner before routing
        setTimeout(() => {
          router.push(data.redirect);
        }, 500);
      } else {
        message.error(data.message || "Invalid admin credentials");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      message.error(error.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Custom filter function for the Select component
  const filterOption = (
    input: string,
    option?: { children?: React.ReactNode; value?: string | number }
  ) => {
    if (!option || !option.children) return false;

    const childrenString = Array.isArray(option.children)
      ? option.children.join("")
      : String(option.children);

    // Case-insensitive filtering
    return childrenString.toLowerCase().includes(input.toLowerCase());
  };

  return (
    <>
      {/* Full-screen overlay spinner for routing */}
      {routing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
            <Spin size="large" />
            <p className="text-primary font-semibold text-lg">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      )}

      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-primary via-background to-secondary/20 p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-card p-6 sm:p-8 md:p-10 relative">
          {/* Optional: Add a subtle spinner in the button during form submission */}
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
              Secure finance management system
            </p>
          </div>

          <Tabs
            defaultActiveKey="assembly"
            centered
            className="w-full"
            size="large"
            tabBarStyle={{ marginBottom: "24px" }}
          >
            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <Church className="w-4 h-4" />
                  Assembly Login
                </span>
              }
              key="assembly"
            >
              <Form
                form={form}
                name="assembly-login-form"
                layout="vertical"
                onFinish={handleAssemblyLogin}
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
                  rules={[
                    { required: true, message: "Please select your assembly" },
                  ]}
                >
                  <Select
                    placeholder="Select your assembly"
                    size="large"
                    className="w-full"
                    showSearch
                    filterOption={filterOption}
                    popupClassName="rounded-lg"
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
                  rules={[
                    { required: true, message: "Please enter the password" },
                  ]}
                >
                  <Input.Password
                    size="large"
                    placeholder="Enter assembly password"
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
                    {loading ? "Signing In..." : "Assembly Sign In"}
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>

            <TabPane
              tab={
                <span className="flex items-center gap-2">
                  <UserCog className="w-4 h-4" />
                  Admin Login
                </span>
              }
              key="admin"
            >
              <Form
                name="admin-login-form"
                layout="vertical"
                onFinish={handleAdminLogin}
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
                  rules={[
                    { required: true, message: "Please enter your email" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input
                    size="large"
                    placeholder="Enter admin email"
                    type="email"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label={
                    <span className="flex items-center gap-2 text-primary font-semibold">
                      <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                      Password
                    </span>
                  }
                  name="password"
                  rules={[
                    { required: true, message: "Please enter your password" },
                  ]}
                >
                  <Input.Password
                    size="large"
                    placeholder="Enter admin password"
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
                    {loading ? "Signing In..." : "Admin Sign In"}
                  </Button>
                </Form.Item>
              </Form>
            </TabPane>
          </Tabs>
        </div>
      </div>
    </>
  );
}
