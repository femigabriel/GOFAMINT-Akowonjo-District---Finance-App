import React from "react";

import AddSubmission from "@/components/submissions/SubissionsPage";
import { NavBar } from "@/components/layout/NavBar";

export default function Submisions() {
  return (
    <div>
      <AddSubmission />
       <div className="lg:hidden block">
        <NavBar />
      </div>
    </div>
  );
};
