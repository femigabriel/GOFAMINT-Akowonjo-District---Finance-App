// app/api/admin/finances/summary/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import TitheRecord from '@/models/TitheRecord';
import MidweekService from '@/lib/models/MidweekService';
import SpecialService from '@/lib/models/SpecialService';
import SundayService from '@/lib/models/SundayService';
;

// GET - Get comprehensive finance summary
export async function GET(request: NextRequest) {
  try {
    await dbConnect('gof-akowonjo');

    const searchParams = request.nextUrl.searchParams;
    const assembly = searchParams.get('assembly');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    // Build common query
    const buildQuery = () => {
      const query: any = {};
      if (assembly) query.assembly = { $regex: assembly, $options: 'i' };
      if (month && year) {
        query.month = `${month}-${year}`;
      } else if (month) {
        query.month = { $regex: `^${month}-`, $options: 'i' };
      } else if (year) {
        query.month = { $regex: `-${year}$`, $options: 'i' };
      }
      return query;
    };

    const query = buildQuery();

    // Fetch all data in parallel
    const [
      titheRecords,
      midweekRecords,
      specialRecords,
      sundayRecords
    ] = await Promise.all([
      TitheRecord.find(query).lean(),
      MidweekService.find(query).lean(),
      SpecialService.find(query).lean(),
      SundayService.find(query).lean()
    ]);

    // Helper function to get unique assemblies from all collections
    const getAllAssemblies = () => {
      const assemblies = new Set<string>();
      
      titheRecords.forEach(r => assemblies.add(r.assembly));
      midweekRecords.forEach(r => assemblies.add(r.assembly));
      specialRecords.forEach(r => assemblies.add(r.assembly));
      sundayRecords.forEach(r => assemblies.add(r.assembly));
      
      return Array.from(assemblies).sort();
    };

    // Calculate totals for each assembly
    const assemblySummaries = getAllAssemblies().map(assemblyName => {
      // Filter records for this assembly
      const assemblyTitheRecords = titheRecords.filter(r => 
        r.assembly.toUpperCase() === assemblyName.toUpperCase()
      );
      const assemblyMidweekRecords = midweekRecords.filter(r => 
        r.assembly.toUpperCase() === assemblyName.toUpperCase()
      );
      const assemblySpecialRecords = specialRecords.filter(r => 
        r.assembly.toUpperCase() === assemblyName.toUpperCase()
      );
      const assemblySundayRecords = sundayRecords.filter(r => 
        r.assembly.toUpperCase() === assemblyName.toUpperCase()
      );

      // Calculate TITHE totals
      const titheData = assemblyTitheRecords.flatMap(record => record.records);
      const titheTotal = titheData.reduce((sum, record) => sum + (record.total || 0), 0);
      const titheByWeek = {
        week1: titheData.reduce((sum, r) => sum + (r.week1 || 0), 0),
        week2: titheData.reduce((sum, r) => sum + (r.week2 || 0), 0),
        week3: titheData.reduce((sum, r) => sum + (r.week3 || 0), 0),
        week4: titheData.reduce((sum, r) => sum + (r.week4 || 0), 0),
        week5: titheData.reduce((sum, r) => sum + (r.week5 || 0), 0)
      };

      // Calculate MIDWEEK totals
      const midweekData = assemblyMidweekRecords.flatMap(record => record.records);
      const midweekTotal = midweekData.reduce((sum, record) => sum + (record.total || 0), 0);
      const midweekByDay = {
        tuesday: midweekData
          .filter(r => r.day?.toLowerCase() === 'tuesday')
          .reduce((sum, r) => sum + (r.total || 0), 0),
        thursday: midweekData
          .filter(r => r.day?.toLowerCase() === 'thursday')
          .reduce((sum, r) => sum + (r.total || 0), 0)
      };

      // Calculate SPECIAL SERVICE totals
      const specialData = assemblySpecialRecords.flatMap(record => record.records);
      const specialTotal = specialData.reduce((sum, record) => sum + (record.offering || 0), 0);
      const specialServices = specialData.map(service => ({
        serviceName: service.serviceName,
        date: service.date,
        attendance: service.attendance || 0,
        offering: service.offering || 0
      }));

      // Calculate SUNDAY SERVICE totals
      const sundayData = assemblySundayRecords.flatMap(record => record.records);
      const sundayTotal = sundayData.reduce((sum, record) => sum + (record.total || 0), 0);
      const sundayBreakdown = {
        tithes: sundayData.reduce((sum, r) => sum + (r.tithes || 0), 0),
        offerings: sundayData.reduce((sum, r) => sum + (r.offerings || 0), 0),
        specialOfferings: sundayData.reduce((sum, r) => sum + (r.specialOfferings || 0), 0),
        etf: sundayData.reduce((sum, r) => sum + (r.etf || 0), 0),
        pastorsWarfare: sundayData.reduce((sum, r) => sum + (r.pastorsWarfare || 0), 0),
        vigil: sundayData.reduce((sum, r) => sum + (r.vigil || 0), 0),
        thanksgiving: sundayData.reduce((sum, r) => sum + (r.thanksgiving || 0), 0),
        retirees: sundayData.reduce((sum, r) => sum + (r.retirees || 0), 0),
        missionaries: sundayData.reduce((sum, r) => sum + (r.missionaries || 0), 0),
        youthOfferings: sundayData.reduce((sum, r) => sum + (r.youthOfferings || 0), 0),
        districtSupport: sundayData.reduce((sum, r) => sum + (r.districtSupport || 0), 0)
      };

      // Calculate attendance
      const totalAttendance = {
        sunday: sundayData.reduce((sum, r) => sum + (r.attendance || 0), 0),
        sundaySbs: sundayData.reduce((sum, r) => sum + (r.sbsAttendance || 0), 0),
        sundayVisitors: sundayData.reduce((sum, r) => sum + (r.visitors || 0), 0),
        midweek: midweekData.reduce((sum, r) => sum + (r.attendance || 0), 0),
        special: specialData.reduce((sum, r) => sum + (r.attendance || 0), 0)
      };

      // Grand totals
      const grandTotal = titheTotal + midweekTotal + specialTotal + sundayTotal;

      return {
        assembly: assemblyName,
        totals: {
          titheTotal,
          midweekTotal,
          specialTotal,
          sundayTotal,
          grandTotal
        },
        breakdown: {
          titheByWeek,
          midweekByDay,
          sundayBreakdown
        },
        attendance: totalAttendance,
        records: {
          titheRecords: assemblyTitheRecords.length,
          midweekRecords: assemblyMidweekRecords.length,
          specialRecords: assemblySpecialRecords.length,
          sundayRecords: assemblySundayRecords.length
        },
        specialServices,
        monthsSubmitted: [
          ...new Set([
            ...assemblyTitheRecords.map(r => r.month),
            ...assemblyMidweekRecords.map(r => r.month),
            ...assemblySpecialRecords.map(r => r.month),
            ...assemblySundayRecords.map(r => r.month)
          ])
        ].sort().reverse()
      };
    });

    // Calculate overall totals across all assemblies
    const overallTotals = {
      titheTotal: assemblySummaries.reduce((sum, a) => sum + a.totals.titheTotal, 0),
      midweekTotal: assemblySummaries.reduce((sum, a) => sum + a.totals.midweekTotal, 0),
      specialTotal: assemblySummaries.reduce((sum, a) => sum + a.totals.specialTotal, 0),
      sundayTotal: assemblySummaries.reduce((sum, a) => sum + a.totals.sundayTotal, 0),
      grandTotal: assemblySummaries.reduce((sum, a) => sum + a.totals.grandTotal, 0),
      totalAssemblies: assemblySummaries.length,
      assembliesWithData: assemblySummaries.filter(a => a.totals.grandTotal > 0).length,
      totalAttendance: {
        sunday: assemblySummaries.reduce((sum, a) => sum + a.attendance.sunday, 0),
        sundaySbs: assemblySummaries.reduce((sum, a) => sum + a.attendance.sundaySbs, 0),
        sundayVisitors: assemblySummaries.reduce((sum, a) => sum + a.attendance.sundayVisitors, 0),
        midweek: assemblySummaries.reduce((sum, a) => sum + a.attendance.midweek, 0),
        special: assemblySummaries.reduce((sum, a) => sum + a.attendance.special, 0)
      }
    };

    // Monthly breakdown
    const monthlyBreakdown = {};
    
    // Combine all records by month
    const allRecords = [
      ...titheRecords.map(r => ({ ...r, type: 'tithe' })),
      ...midweekRecords.map(r => ({ ...r, type: 'midweek' })),
      ...specialRecords.map(r => ({ ...r, type: 'special' })),
      ...sundayRecords.map(r => ({ ...r, type: 'sunday' }))
    ];

    allRecords.forEach(record => {
      const month = record.month;
      if (!monthlyBreakdown[month]) {
        monthlyBreakdown[month] = {
          month,
          assemblies: new Set(),
          totals: {
            tithe: 0,
            midweek: 0,
            special: 0,
            sunday: 0,
            grand: 0
          },
          attendance: {
            sunday: 0,
            midweek: 0,
            special: 0
          }
        };
      }

      monthlyBreakdown[month].assemblies.add(record.assembly);

      // Calculate totals based on record type
      if (record.type === 'tithe') {
        const total = record.records.reduce((sum, r) => sum + (r.total || 0), 0);
        monthlyBreakdown[month].totals.tithe += total;
        monthlyBreakdown[month].totals.grand += total;
      } else if (record.type === 'midweek') {
        const total = record.records.reduce((sum, r) => sum + (r.total || 0), 0);
        const attendance = record.records.reduce((sum, r) => sum + (r.attendance || 0), 0);
        monthlyBreakdown[month].totals.midweek += total;
        monthlyBreakdown[month].totals.grand += total;
        monthlyBreakdown[month].attendance.midweek += attendance;
      } else if (record.type === 'special') {
        const total = record.records.reduce((sum, r) => sum + (r.offering || 0), 0);
        const attendance = record.records.reduce((sum, r) => sum + (r.attendance || 0), 0);
        monthlyBreakdown[month].totals.special += total;
        monthlyBreakdown[month].totals.grand += total;
        monthlyBreakdown[month].attendance.special += attendance;
      } else if (record.type === 'sunday') {
        const total = record.records.reduce((sum, r) => sum + (r.total || 0), 0);
        const attendance = record.records.reduce((sum, r) => sum + (r.attendance || 0), 0);
        monthlyBreakdown[month].totals.sunday += total;
        monthlyBreakdown[month].totals.grand += total;
        monthlyBreakdown[month].attendance.sunday += attendance;
      }
    });

    // Convert to array and sort
    const monthlyArray = Object.values(monthlyBreakdown)
      .map((m: any) => ({
        ...m,
        assemblies: Array.from(m.assemblies),
        averagePerAssembly: m.assemblies.size > 0 ? m.totals.grand / m.assemblies.size : 0
      }))
      .sort((a: any, b: any) => b.month.localeCompare(a.month));

    // Get available months for filtering
    const allMonths = [
      ...new Set([
        ...titheRecords.map(r => r.month),
        ...midweekRecords.map(r => r.month),
        ...specialRecords.map(r => r.month),
        ...sundayRecords.map(r => r.month)
      ])
    ].sort().reverse();

    const years = [...new Set(allMonths.map(m => m.split('-')[1]))].sort().reverse();

    return NextResponse.json({
      success: true,
      data: {
        overall: overallTotals,
        byAssembly: assemblySummaries,
        byMonth: monthlyArray,
        summary: {
          totalRecords: {
            tithe: titheRecords.length,
            midweek: midweekRecords.length,
            special: specialRecords.length,
            sunday: sundayRecords.length,
            total: allRecords.length
          },
          averagePerAssembly: overallTotals.totalAssemblies > 0 
            ? overallTotals.grandTotal / overallTotals.totalAssemblies 
            : 0,
          highestEarningAssembly: assemblySummaries.length > 0
            ? assemblySummaries.reduce((prev, current) => 
                prev.totals.grandTotal > current.totals.grandTotal ? prev : current
              )
            : null,
          bestAttendanceAssembly: assemblySummaries.length > 0
            ? assemblySummaries.reduce((prev, current) => 
                (prev.attendance.sunday + prev.attendance.midweek + prev.attendance.special) >
                (current.attendance.sunday + current.attendance.midweek + current.attendance.special) 
                  ? prev : current
              )
            : null
        },
        filters: {
          years,
          months: allMonths,
          assemblies: getAllAssemblies()
        },
        generatedAt: new Date().toISOString(),
        period: month && year ? `${month} ${year}` : year ? year : 'All Time'
      }
    });

  } catch (error: any) {
    console.error('Error fetching finance summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch finance summary' 
      },
      { status: 500 }
    );
  }
}