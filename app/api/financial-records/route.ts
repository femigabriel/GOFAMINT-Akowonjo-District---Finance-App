// app/api/financial-records/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import FinancialRecord from "@/models/FinancialRecord";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();
    console.log("Connected to MongoDB (Financial POST)");

    const { assembly, month, records, submittedBy } = await request.json();

    if (!assembly || !month || !submittedBy || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Filter out empty records
    const validRecords = records.filter((record: any) => {
      return (
        record.description ||
        record.amount > 0 ||
        record.category ||
        record.type
      );
    });

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: "No valid records to save" },
        { status: 400 }
      );
    }

    // Calculate totals
    const incomeTotal = validRecords
      .filter((r: any) => r.type === 'income')
      .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

    const expenseTotal = validRecords
      .filter((r: any) => r.type === 'expense')
      .reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

    const netTotal = incomeTotal - expenseTotal;

    const financialRecord = await FinancialRecord.findOneAndUpdate(
      { assembly, month },
      {
        assembly,
        submittedBy,
        month,
        records: validRecords,
        totals: {
          income: incomeTotal,
          expense: expenseTotal,
          net: netTotal
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return NextResponse.json({
      success: true,
      message: `${validRecords.length} financial record(s) saved`,
      data: financialRecord
    });

  } catch (err: any) {
    console.error("Financial POST error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");

    if (!assembly || !month) {
      return NextResponse.json(
        { error: "assembly and month required" },
        { status: 400 }
      );
    }

    const emptyResponse = {
      _id: null,
      assembly,
      submittedBy: "",
      month,
      records: [],
      totals: { income: 0, expense: 0, net: 0 },
      createdAt: null,
      updatedAt: null,
      __v: 0
    };

    const doc = await FinancialRecord.findOne({ assembly, month })
      .sort({ createdAt: -1 })
      .lean();

    if (!doc) {
      return NextResponse.json(emptyResponse);
    }

    return NextResponse.json(doc);
    
  } catch (err: any) {
    console.error("Financial GET error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" }, 
      { status: 500 }
    );
  }
}