// app/api/admin/tithes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';

// GET - Get all tithe records with filtering and aggregation
export async function GET(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const searchParams = request.nextUrl.searchParams;
    const assembly = searchParams.get('assembly');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const district = searchParams.get('district');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    
    if (assembly) {
      query.assembly = { $regex: assembly, $options: 'i' };
    }
    
    if (month && year) {
      query.month = `${month}-${year}`;
    } else if (month) {
      query.month = { $regex: `^${month}-`, $options: 'i' };
    } else if (year) {
      query.month = { $regex: `-${year}$`, $options: 'i' };
    }
    
    if (district) {
      // Assuming you have a district mapping somewhere
      // You might need to adjust this based on your data structure
      query.district = district;
    }

    // Get total count for pagination
    const totalCount = await TitheRecord.countDocuments(query);

    // Get paginated records with population if needed
    const records = await TitheRecord.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate summary statistics
    const summary = await TitheRecord.aggregate([
      { $match: query },
      { $unwind: '$records' },
      {
        $group: {
          _id: null,
          totalTitheAmount: { $sum: '$records.total' },
          totalRecords: { $sum: 1 },
          totalAssemblies: { $addToSet: '$assembly' },
          totalSubmittedBy: { $addToSet: '$submittedBy' }
        }
      },
      {
        $project: {
          totalTitheAmount: 1,
          totalRecords: 1,
          totalAssemblies: { $size: '$totalAssemblies' },
          totalSubmitters: { $size: '$totalSubmittedBy' }
        }
      }
    ]);

    // Get assemblies list for dropdowns
    const assemblies = await TitheRecord.distinct('assembly');
    const months = await TitheRecord.distinct('month');

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page * limit < totalCount,
          hasPrevPage: page > 1
        },
        summary: summary[0] || {
          totalTitheAmount: 0,
          totalRecords: 0,
          totalAssemblies: 0,
          totalSubmitters: 0
        },
        filters: {
          assemblies,
          months
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching admin tithe records:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch tithe records' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a specific tithe record (admin only)
export async function DELETE(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }

    const deletedRecord = await TitheRecord.findByIdAndDelete(id);

    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully',
      deletedId: id
    });

  } catch (error: any) {
    console.error('Error deleting tithe record:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to delete record' 
      },
      { status: 500 }
    );
  }
}