import React from "react";

import { NavBar } from "@/components/layout/NavBar";
import Dssreportpage from "@/components/dssreport/Dssreportpage";

export default function Reports() {
  return (
    <div>
      <Dssreportpage />
       <div className="lg:hidden block mt-10">
        <div className="h-[50px]"></div>
        <NavBar />
      </div>
    </div>
  );
};
