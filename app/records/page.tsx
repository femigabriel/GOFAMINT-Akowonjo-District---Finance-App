import React from "react";

import { NavBar } from "@/components/layout/NavBar";
import RecordsPage from "@/components/records/RecordsPage";

export default function Submisions() {
  return (
    <div>
      <RecordsPage />
       <div className="lg:hidden block">
        <NavBar />
      </div>
    </div>
  );
};
