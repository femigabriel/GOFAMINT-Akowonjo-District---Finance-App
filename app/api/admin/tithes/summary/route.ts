// app/api/admin/tithes/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';
import { titheData } from '@/lib/tithe-data';

// Helper to get assembly member count from tithe-data
const getAssemblyMemberCount = (assemblyName: string): number => {
  const assembly = titheData.find(
    item => item.assembly.toUpperCase() === assemblyName.toUpperCase()
  );
  return assembly ? assembly.members.length : 0;
};

// Helper to get all assembly names from tithe-data
const getAllAssemblies = () => {
  return titheData.map(item => ({
    name: item.assembly,
    memberCount: item.members.length,
    members: item.members
  }));
};

// GET - Get comprehensive statistics with member comparison
export async function GET(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const assembly = searchParams.get('assembly');

    // Build match query for database
    const matchQuery: any = {};
    if (month && year) {
      matchQuery.month = `${month}-${year}`;
    } else if (month) {
      matchQuery.month = { $regex: `^${month}-`, $options: 'i' };
    } else if (year) {
      matchQuery.month = { $regex: `-${year}$`, $options: 'i' };
    }
    if (assembly) {
      matchQuery.assembly = assembly;
    }

    // Get all assemblies from static data
    const allAssemblies = getAllAssemblies();
    
    // Get tithe records from database
    const titheRecords = await TitheRecord.find(matchQuery)
      .sort({ assembly: 1, month: 1 })
      .lean();

    // Process each assembly
    const assemblySummaries = allAssemblies.map(assemblyData => {
      const assemblyName = assemblyData.name;
      const totalMembers = assemblyData.memberCount;
      
      // Find tithe records for this assembly
      const assemblyRecords = titheRecords.filter(record => 
        record.assembly.toUpperCase() === assemblyName.toUpperCase()
      );

      // Flatten all member records for this assembly
      const allMemberRecords = assemblyRecords.flatMap(record => record.records);
      
      // Create a map of member name to their payment details
      const memberPaymentMap = new Map();
      
      allMemberRecords.forEach(record => {
        const name = record.name;
        const paidAmount = record.total;
        const weeks = {
          week1: record.week1 > 0,
          week2: record.week2 > 0,
          week3: record.week3 > 0,
          week4: record.week4 > 0,
          week5: record.week5 > 0
        };
        
        if (memberPaymentMap.has(name)) {
          // Update existing record
          const existing = memberPaymentMap.get(name);
          existing.totalPaid += paidAmount;
          existing.weeks.week1 = existing.weeks.week1 || weeks.week1;
          existing.weeks.week2 = existing.weeks.week2 || weeks.week2;
          existing.weeks.week3 = existing.weeks.week3 || weeks.week3;
          existing.weeks.week4 = existing.weeks.week4 || weeks.week4;
          existing.weeks.week5 = existing.weeks.week5 || weeks.week5;
          existing.recordCount += 1;
        } else {
          // New record
          memberPaymentMap.set(name, {
            name,
            titheNumber: record.titheNumber,
            totalPaid: paidAmount,
            weeks,
            recordCount: 1,
            paid: paidAmount > 0
          });
        }
      });

      // Get paid and unpaid members
      const paidMembers = Array.from(memberPaymentMap.values()).filter(m => m.paid);
      const unpaidMembers = Array.from(memberPaymentMap.values()).filter(m => !m.paid);
      
      // Calculate totals
      const totalTithe = paidMembers.reduce((sum, member) => sum + member.totalPaid, 0);
      const paidCount = paidMembers.length;
      const unpaidCount = unpaidMembers.length;
      const missingMembers = totalMembers - (paidCount + unpaidCount);
      
      // Calculate weekly totals
      const weeklyTotals = {
        week1: allMemberRecords.reduce((sum, r) => sum + (r.week1 || 0), 0),
        week2: allMemberRecords.reduce((sum, r) => sum + (r.week2 || 0), 0),
        week3: allMemberRecords.reduce((sum, r) => sum + (r.week3 || 0), 0),
        week4: allMemberRecords.reduce((sum, r) => sum + (r.week4 || 0), 0),
        week5: allMemberRecords.reduce((sum, r) => sum + (r.week5 || 0), 0)
      };

      // Get months this assembly has submitted
      const submissionMonths = [...new Set(assemblyRecords.map(r => r.month))];
      
      return {
        assembly: assemblyName,
        stats: {
          totalMembers,
          paidMembers: paidCount,
          unpaidMembers: unpaidCount,
          missingMembers,
          totalTithe,
          averageTithe: paidCount > 0 ? totalTithe / paidCount : 0,
          paymentRate: (paidCount / totalMembers) * 100,
          submissionCount: assemblyRecords.length,
          submissionMonths
        },
        weeklyTotals,
        paidMembers: paidMembers.map(m => ({
          name: m.name,
          titheNumber: m.titheNumber,
          totalPaid: m.totalPaid,
          weeks: m.weeks,
          lastRecord: assemblyRecords[0]?.month || 'N/A'
        })),
        unpaidMembers: unpaidMembers.map(m => ({
          name: m.name,
          titheNumber: m.titheNumber,
          weeks: m.weeks
        })),
        // Members from static list who haven't submitted at all
        missingMemberList: assemblyData.members
          .filter(member => 
            !Array.from(memberPaymentMap.keys())
              .some(name => name.toLowerCase().includes(member.name.toLowerCase()) ||
                           member.name.toLowerCase().includes(name.toLowerCase()))
          )
          .map(member => ({
            name: member.name,
            sn: member.sn
          }))
      };
    });

    // Overall statistics
    const overallStats = {
      totalAssemblies: allAssemblies.length,
      totalAllMembers: allAssemblies.reduce((sum, a) => sum + a.memberCount, 0),
      totalPaidMembers: assemblySummaries.reduce((sum, a) => sum + a.stats.paidMembers, 0),
      totalUnpaidMembers: assemblySummaries.reduce((sum, a) => sum + a.stats.unpaidMembers, 0),
      totalMissingMembers: assemblySummaries.reduce((sum, a) => sum + a.stats.missingMembers, 0),
      grandTotalTithe: assemblySummaries.reduce((sum, a) => sum + a.stats.totalTithe, 0),
      assembliesWithSubmissions: assemblySummaries.filter(a => a.stats.submissionCount > 0).length,
      totalSubmissions: titheRecords.length
    };

    // Monthly breakdown
    const monthlyBreakdown = titheRecords.reduce((acc, record) => {
      const month = record.month;
      if (!acc[month]) {
        acc[month] = {
          month,
          assemblies: new Set(),
          totalTithe: 0,
          totalMembers: 0
        };
      }
      
      acc[month].assemblies.add(record.assembly);
      acc[month].totalTithe += record.records.reduce((sum, r) => sum + r.total, 0);
      acc[month].totalMembers += record.records.length;
      
      return acc;
    }, {});

    // Convert to array
    const monthlyArray = Object.values(monthlyBreakdown).map((m: any) => ({
      ...m,
      assemblies: Array.from(m.assemblies),
      averageTithe: m.totalMembers > 0 ? m.totalTithe / m.totalMembers : 0
    }));

    // Get all months from database
    const allMonths = await TitheRecord.distinct('month');
    const years = [...new Set(allMonths.map(m => m.split('-')[1]))].sort().reverse();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          overall: overallStats,
          byAssembly: assemblySummaries,
          byMonth: monthlyArray.sort((a, b) => b.month.localeCompare(a.month))
        },
        filters: {
          years,
          months: allMonths,
          assemblies: allAssemblies.map(a => a.name)
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