import MidweekReport from "@/lib/models/MidweekReport";
import SpecialServiceReport from "@/lib/models/SpecialServiceReport";
import SundayServiceReport from "@/lib/models/SundayServiceReport";
import dbConnect from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const assembly = searchParams.get("assembly");
    const month = searchParams.get("month");

    const filter: any = {};
    if (assembly) filter.assembly = assembly;
    if (month) filter.month = month;

    const [midweek, special, sunday] = await Promise.all([
      MidweekReport.find(filter),
      SpecialServiceReport.find(filter),
      SundayServiceReport.find(filter),
    ]);

    const totalOffering =
      midweek.reduce((s, r) => s + sum(r.records, "offering"), 0) +
      special.reduce((s, r) => s + sum(r.records, "offering"), 0) +
      sunday.reduce((s, r) => s + sum(r.records, "offerings"), 0);

    const totalTithes = sunday.reduce(
      (s, r) => s + sum(r.records, "tithes"),
      0
    );

    const grandTotal =
      midweek.reduce((s, r) => s + sum(r.records, "total"), 0) +
      sunday.reduce((s, r) => s + sum(r.records, "total"), 0);

    return Response.json({
      success: true,
      assembly: assembly || "ALL",
      month: month || "ALL",
      midweekServices: midweek,
      specialServices: special,
      sundayServices: sunday,
      summary: {
        totalOffering,
        totalTithes,
        grandTotal,
      },
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Helper
function sum(arr: any[], field: string) {
  return arr.reduce((t, i) => t + (Number(i[field]) || 0), 0);
}
