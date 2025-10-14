// app/api/offerings/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import OfferingRecord from '@/models/OfferingRecord';

export async function POST(request: Request) {
  try {
    await dbConnect();
    console.log('Connected to MongoDB for POST /api/offerings');
    const { assembly, submittedBy, month, type, records } = await request.json();
    console.log('Received data:', { assembly, submittedBy, month, type, recordsCount: records.length });

    if (!assembly || !submittedBy || !month || !type || !records) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate records
    const validRecords = records.filter(
      (r: any) =>
        (r.week1 > 0 || r.week2 > 0 || r.week3 > 0 || r.week4 > 0 || (r.week5 ?? 0) > 0 ||
         r.tuesdayWeek1 > 0 || r.tuesdayWeek2 > 0 || r.tuesdayWeek3 > 0 || r.tuesdayWeek4 > 0 || (r.tuesdayWeek5 ?? 0) > 0 ||
         r.thursdayWeek1 > 0 || r.thursdayWeek2 > 0 || r.thursdayWeek3 > 0 || r.thursdayWeek4 > 0 || (r.thursdayWeek5 ?? 0) > 0 ||
         r.amount > 0)
    );
    console.log('Valid records to save:', validRecords.length);

    if (validRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid records to save' },
        { status: 400 }
      );
    }

    const offeringRecord = new OfferingRecord({
      assembly,
      submittedBy,
      month,
      type,
      records: validRecords,
    });

    await offeringRecord.save();
    console.log('Offering record saved successfully');

    return NextResponse.json({
      success: true,
      message: `${validRecords.length} record(s) saved successfully`,
    });
  } catch (error) {
    console.error('Error saving offering records:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    console.log('Connected to MongoDB for GET /api/offerings');
    const { searchParams } = new URL(request.url);
    const assembly = searchParams.get('assembly');
    const type = searchParams.get('type');
    const month = searchParams.get('month');

    if (!assembly || !type || !month) {
      return NextResponse.json(
        { error: 'Assembly, type, and month are required' },
        { status: 400 }
      );
    }

    // Get the most recent record for the assembly, type, and month
    const latestRecord = await OfferingRecord.findOne({ assembly, type, month })
      .sort({ createdAt: -1 })
      .select('records');

    const records = latestRecord
      ? latestRecord.records
      : Array.from({ length: 5 }, () => ({
          week1: 0,
          week2: 0,
          week3: 0,
          week4: 0,
          week5: 0,
          tuesdayWeek1: 0,
          tuesdayWeek2: 0,
          tuesdayWeek3: 0,
          tuesdayWeek4: 0,
          tuesdayWeek5: 0,
          thursdayWeek1: 0,
          thursdayWeek2: 0,
          thursdayWeek3: 0,
          thursdayWeek4: 0,
          thursdayWeek5: 0,
          amount: 0,
          total: 0,
        }));

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Error fetching offering records:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}