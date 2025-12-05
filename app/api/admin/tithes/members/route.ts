// app/api/admin/tithes/members/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';
import { titheData } from '@/lib/tithe-data';

// GET - Get detailed member payment history
export async function GET(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const searchParams = request.nextUrl.searchParams;
    const assembly = searchParams.get('assembly');
    const memberName = searchParams.get('name');
    const month = searchParams.get('month');

    if (!assembly) {
      return NextResponse.json(
        { success: false, error: 'Assembly is required' },
        { status: 400 }
      );
    }

    // Build query
    const query: any = { assembly: { $regex: assembly, $options: 'i' } };
    if (month) query.month = month;

    // Get tithe records
    const titheRecords = await TitheRecord.find(query)
      .sort({ month: -1 })
      .lean();

    // Get member list for this assembly
    const assemblyData = titheData.find(
      item => item.assembly.toUpperCase() === assembly.toUpperCase()
    );

    if (!assemblyData) {
      return NextResponse.json(
        { success: false, error: 'Assembly not found in member list' },
        { status: 404 }
      );
    }

    // Process each member
    const memberDetails = assemblyData.members.map(member => {
      // Find all records for this member (fuzzy name matching)
      const memberRecords = titheRecords.flatMap(record => 
        record.records.filter((r: { name: string; }) => 
          r.name.toLowerCase().includes(member.name.toLowerCase()) ||
          member.name.toLowerCase().includes(r.name.toLowerCase())
        )
      );

      // Calculate totals
      const totalPaid = memberRecords.reduce((sum, r) => sum + r.total, 0);
      const monthsPaid = [...new Set(titheRecords
        .filter(record => 
          record.records.some((r: { name: string; }) => 
            r.name.toLowerCase().includes(member.name.toLowerCase()) ||
            member.name.toLowerCase().includes(r.name.toLowerCase())
          )
        )
        .map(r => r.month)
      )];

      // Weekly breakdown
      const weeklyBreakdown = {
        week1: memberRecords.reduce((sum, r) => sum + (r.week1 || 0), 0),
        week2: memberRecords.reduce((sum, r) => sum + (r.week2 || 0), 0),
        week3: memberRecords.reduce((sum, r) => sum + (r.week3 || 0), 0),
        week4: memberRecords.reduce((sum, r) => sum + (r.week4 || 0), 0),
        week5: memberRecords.reduce((sum, r) => sum + (r.week5 || 0), 0)
      };

      return {
        sn: member.sn,
        name: member.name,
        titheNumber: memberRecords[0]?.titheNumber || 'Not assigned',
        totalPaid,
        monthsPaid,
        paymentCount: memberRecords.length,
        lastPayment: monthsPaid[0] || 'Never',
        weeklyBreakdown,
        records: memberRecords.map(r => ({
          month: titheRecords.find(tr => tr.records.some((rec: { _id: any; }) => rec._id === r._id))?.month,
          weeks: {
            week1: r.week1,
            week2: r.week2,
            week3: r.week3,
            week4: r.week4,
            week5: r.week5
          },
          total: r.total
        }))
      };
    });

    // Filter by member name if provided
    const filteredMembers = memberName
      ? memberDetails.filter(m => 
          m.name.toLowerCase().includes(memberName.toLowerCase())
        )
      : memberDetails;

    // Calculate assembly totals
    const assemblyTotals = {
      totalMembers: assemblyData.members.length,
      membersWithPayments: memberDetails.filter(m => m.totalPaid > 0).length,
      totalTithe: memberDetails.reduce((sum, m) => sum + m.totalPaid, 0),
      averageTithe: memberDetails.filter(m => m.totalPaid > 0).length > 0
        ? memberDetails.reduce((sum, m) => sum + m.totalPaid, 0) / 
          memberDetails.filter(m => m.totalPaid > 0).length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        assembly: assemblyData.assembly,
        totals: assemblyTotals,
        members: filteredMembers.sort((a, b) => a.sn - b.sn),
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Error fetching member details:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch member details' 
      },
      { status: 500 }
    );
  }
}