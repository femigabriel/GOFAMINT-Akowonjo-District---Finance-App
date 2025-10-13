import React from "react";
import DashboardPage from "./DashboardPage";
import { NavBar } from "../layout/NavBar";

export const Dashboard = () => {
  return (
    <div>
      <DashboardPage />
       <div className="lg:hidden block">
        <NavBar />
      </div>
    </div>
  );
};
