// app/api/tithes/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { assembly, submittedBy, month, records } = await request.json();

    if (!assembly || !submittedBy || !month || !records) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate records
    const validRecords = records.filter(
      (r: any) =>
        r.name?.trim() &&
        r.titheNumber?.trim() &&
        (r.week1 > 0 || r.week2 > 0 || r.week3 > 0 || r.week4 > 0 || r.week5 > 0)
    );

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid records to save' },
        { status: 400 }
      );
    }

    const titheRecord = new TitheRecord({
      assembly,
      submittedBy,
      month,
      records: validRecords,
    });

    await titheRecord.save();

    return NextResponse.json({
      success: true,
      message: `${validRecords.length} record(s) saved successfully`,
    });
  } catch (error) {
    console.error('Error saving tithe records:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get('assembly');

    if (!assembly) {
      return NextResponse.json(
        { error: 'Assembly is required' },
        { status: 400 }
      );
    }

    // Get the most recent tithe record for the assembly
    const latestRecord = await TitheRecord.findOne({ assembly })
      .sort({ createdAt: -1 })
      .select('records');

    const titherList = latestRecord
      ? latestRecord.records.map((r: any) => ({
          name: r.name,
          titheNumber: r.titheNumber,
          week1: 0,
          week2: 0,
          week3: 0,
          week4: 0,
          week5: 0,
          total: 0,
        }))
      : Array.from({ length: 200 }, () => ({
          name: '',
          titheNumber: '',
          week1: 0,
          week2: 0,
          week3: 0,
          week4: 0,
          week5: 0,
          total: 0,
        }));

    return NextResponse.json({ titherList });
  } catch (error) {
    console.error('Error fetching tither list:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}