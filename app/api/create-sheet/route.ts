import { google } from "googleapis";
import { NextResponse } from "next/server";

// Load credentials (service account JSON placed in your project, or env var)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export async function POST(req: Request) {
  try {
    const { assemblyName } = await req.json();

    const sheets = google.sheets({ version: "v4", auth });

    // Create new spreadsheet
    const res = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `${assemblyName} - Finance Records`,
        },
        sheets: [
          { properties: { title: "Tithes" } },
          { properties: { title: "Offerings" } },
          { properties: { title: "Expenses" } },
        ],
      },
    });

    return NextResponse.json({
      message: "Spreadsheet created successfully",
      spreadsheetId: res.data.spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${res.data.spreadsheetId}`,
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
