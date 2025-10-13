"use client";
import { useState } from "react";

export default function CreateAssembly() {
  const [assemblyName, setAssemblyName] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");

  async function handleCreate() {
    const res = await fetch("/api/create-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assemblyName }),
    });
    const data = await res.json();
    if (data.url) setSheetUrl(data.url);
  }

  return (
    <div className="p-4">
      <h2 className="text-xl mb-2">Create New Assembly Sheet</h2>
      <input
        className="border p-2 mr-2"
        value={assemblyName}
        onChange={(e) => setAssemblyName(e.target.value)}
        placeholder="Enter Assembly Name"
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={handleCreate}
      >
        Create
      </button>
      {sheetUrl && (
        <p className="mt-4">
          ✅ Sheet created:{" "}
          <a className="text-blue-500 underline" href={sheetUrl} target="_blank">
            Open in Google Sheets
          </a>
        </p>
      )}
    </div>
  );
}
