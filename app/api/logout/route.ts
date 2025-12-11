import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Clear authentication cookies
  response.cookies.delete('user-role');
  response.cookies.delete('assembly-name');
  
  return response;
}