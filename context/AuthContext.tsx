// lib/AuthContext.tsx - Updated
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";

interface AuthContextType {
  assembly: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  userData: any | null;
  login: (assembly: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [assembly, setAssembly] = useState<string | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for stored auth on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const storedUserData = localStorage.getItem("userData");
        const storedAssembly = localStorage.getItem("assembly");
        
        if (token && storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          
          if (parsedData.role === 'assembly' && storedAssembly) {
            setAssembly(storedAssembly);
          }
          
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (assembly: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          loginType: "assembly", 
          assembly, 
          password 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Save to localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userData", JSON.stringify(data.userData));
        localStorage.setItem("role", data.role);
        localStorage.setItem("assembly", data.userData.assembly);
        
        setAssembly(assembly);
        setUserData(data.userData);
        setIsAuthenticated(true);
        
        message.success(`Welcome, ${assembly} Assembly!`);
        router.push(data.redirect || "/assembly/dashboard");
      } else {
        message.error(data.message || "Invalid assembly or password");
      }
    } catch {
      message.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all localStorage items
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("role");
    localStorage.removeItem("assembly");
    localStorage.removeItem("admin");
    
    setAssembly(null);
    setUserData(null);
    setIsAuthenticated(false);
    
    message.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ 
      assembly, 
      isAuthenticated, 
      loading, 
      userData,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}