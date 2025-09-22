// lib/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { assemblies } from "@/lib/assemblies";

interface AuthContextType {
  assembly: string | null;
  isAuthenticated: boolean;
  login: (assembly: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check for stored assembly on mount
  useEffect(() => {
    const storedAssembly = localStorage.getItem("assembly");
    if (storedAssembly && assemblies.includes(storedAssembly)) {
      setAssembly(storedAssembly);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (assembly: string, password: string) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assembly, password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        localStorage.setItem("assembly", assembly);
        setAssembly(assembly);
        setIsAuthenticated(true);
        message.success(`Welcome, ${assembly} Assembly`);
        router.push("/dashboard");
      } else {
        message.error(data.error || "Invalid assembly or password");
      }
    } catch (error) {
      message.error("An error occurred. Please try again.");
    }
  };

  const logout = () => {
    localStorage.removeItem("assembly");
    setAssembly(null);
    setIsAuthenticated(false);
    message.success("Logged out successfully");
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ assembly, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}