// app/api/tithes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';

// POST - Save or Update tithe records
export async function POST(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const body = await request.json();
    const { assembly, submittedBy, month, records } = body;

    // Validate required fields
    if (!assembly || !submittedBy || !month || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate each record
    const validatedRecords = records.map(record => ({
      name: record.name?.trim() || '',
      titheNumber: record.titheNumber?.trim() || '',
      week1: Number(record.week1) || 0,
      week2: Number(record.week2) || 0,
      week3: Number(record.week3) || 0,
      week4: Number(record.week4) || 0,
      week5: Number(record.week5) || 0,
      total: Number(record.total) || 0,
    }));

    // Check if record already exists for this assembly and month
    const existingRecord = await TitheRecord.findOne({
      assembly: assembly.trim(),
      month: month.trim()
    });

    let savedRecord;
    let isUpdate = false;

    if (existingRecord) {
      // Update existing record
      existingRecord.records = validatedRecords;
      existingRecord.submittedBy = submittedBy.trim();
      existingRecord.updatedAt = new Date();
      savedRecord = await existingRecord.save();
      isUpdate = true;
    } else {
      // Create new record
      const newTitheRecord = new TitheRecord({
        assembly: assembly.trim(),
        submittedBy: submittedBy.trim(),
        month: month.trim(),
        records: validatedRecords,
        createdAt: new Date()
      });
      savedRecord = await newTitheRecord.save();
    }

    return NextResponse.json({
      success: true,
      message: isUpdate ? 'Tithe records updated successfully' : 'Tithe records saved successfully',
      isUpdate,
      data: {
        id: savedRecord._id,
        assembly: savedRecord.assembly,
        month: savedRecord.month,
        recordCount: savedRecord.records.length,
        createdAt: savedRecord.createdAt,
        updatedAt: savedRecord.updatedAt
      }
    });

  } catch (error: any) {
    console.error('Error saving tithe records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save tithe records' 
      },
      { status: 500 }
    );
  }
}

// GET - Retrieve tithe records (for page refresh/persistence)
export async function GET(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const searchParams = request.nextUrl.searchParams;
    const assembly = searchParams.get('assembly');
    const month = searchParams.get('month');
    const id = searchParams.get('id');

    // Build query
    const query: any = {};
    if (assembly) query.assembly = assembly;
    if (month) query.month = month;
    if (id) query._id = id;

    // Get records with optional sorting and limiting
    const records = await TitheRecord.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      success: true,
      data: records,
      count: records.length
    });

  } catch (error: any) {
    console.error('Error fetching tithe records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch tithe records' 
      },
      { status: 500 }
    );
  }
}