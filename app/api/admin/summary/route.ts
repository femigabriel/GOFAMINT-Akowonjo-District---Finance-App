// app/api/admin/tithes/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';

// GET - Get comprehensive statistics
export async function GET(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year');
    const assembly = searchParams.get('assembly');

    // Build match query
    const matchQuery: any = {};
    if (year) {
      matchQuery.month = { $regex: `-${year}$`, $options: 'i' };
    }
    if (assembly) {
      matchQuery.assembly = assembly;
    }

    // Monthly statistics
    const monthlyStats = await TitheRecord.aggregate([
      { $match: matchQuery },
      { $unwind: '$records' },
      {
        $group: {
          _id: '$month',
          totalTithe: { $sum: '$records.total' },
          totalMembers: { $sum: 1 },
          totalAssemblies: { $addToSet: '$assembly' },
          paidMembers: {
            $sum: {
              $cond: [{ $gt: ['$records.total', 0] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          month: '$_id',
          totalTithe: 1,
          totalMembers: 1,
          totalAssemblies: { $size: '$totalAssemblies' },
          paidMembers: 1,
          unpaidMembers: { $subtract: ['$totalMembers', '$paidMembers'] },
          averageTithe: { $divide: ['$totalTithe', { $max: ['$paidMembers', 1] }] }
        }
      },
      { $sort: { month: -1 } }
    ]);

    // Assembly-wise statistics
    const assemblyStats = await TitheRecord.aggregate([
      { $match: matchQuery },
      { $unwind: '$records' },
      {
        $group: {
          _id: '$assembly',
          totalTithe: { $sum: '$records.total' },
          totalMembers: { $sum: 1 },
          totalMonths: { $addToSet: '$month' },
          paidMembers: {
            $sum: {
              $cond: [{ $gt: ['$records.total', 0] }, 1, 0]
            }
          },
          lastSubmission: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          assembly: '$_id',
          totalTithe: 1,
          totalMembers: 1,
          totalMonths: { $size: '$totalMonths' },
          paidMembers: 1,
          unpaidMembers: { $subtract: ['$totalMembers', '$paidMembers'] },
          averageTithe: { $divide: ['$totalTithe', { $max: ['$paidMembers', 1] }] },
          lastSubmission: 1,
          participationRate: {
            $multiply: [
              { $divide: ['$paidMembers', { $max: ['$totalMembers', 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { totalTithe: -1 } }
    ]);

    // Overall summary
    const overallStats = await TitheRecord.aggregate([
      { $match: matchQuery },
      { $unwind: '$records' },
      {
        $group: {
          _id: null,
          grandTotalTithe: { $sum: '$records.total' },
          totalRecordsCount: { $sum: 1 },
          uniqueAssemblies: { $addToSet: '$assembly' },
          uniqueSubmitters: { $addToSet: '$submittedBy' },
          paidMembers: {
            $sum: {
              $cond: [{ $gt: ['$records.total', 0] }, 1, 0]
            }
          }
        }
      },
      {
        $project: {
          grandTotalTithe: 1,
          totalRecordsCount: 1,
          uniqueAssemblies: { $size: '$uniqueAssemblies' },
          uniqueSubmitters: { $size: '$uniqueSubmitters' },
          paidMembers: 1,
          unpaidMembers: { $subtract: ['$totalRecordsCount', '$paidMembers'] },
          averageTithe: { $divide: ['$grandTotalTithe', { $max: ['$paidMembers', 1] }] }
        }
      }
    ]);

    // Recent submissions
    const recentSubmissions = await TitheRecord.find(matchQuery)
      .sort({ createdAt: -1 })
      .limit(10)
      .select('assembly month submittedBy records createdAt')
      .lean();

    // Get available years for filtering
    const allMonths = await TitheRecord.distinct('month');
    const years = [...new Set(allMonths.map(m => m.split('-')[1]))].sort().reverse();

    return NextResponse.json({
      success: true,
      data: {
        monthlyStats,
        assemblyStats,
        overallStats: overallStats[0] || {
          grandTotalTithe: 0,
          totalRecordsCount: 0,
          uniqueAssemblies: 0,
          uniqueSubmitters: 0,
          paidMembers: 0,
          unpaidMembers: 0,
          averageTithe: 0
        },
        recentSubmissions,
        filters: {
          years,
          assemblies: await TitheRecord.distinct('assembly')
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching summary statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch statistics' 
      },
      { status: 500 }
    );
  }
}