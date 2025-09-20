// app/api/login/route.ts
import { NextResponse } from 'next/server';
import { assemblies } from '@/lib/assemblies';

export async function POST(request: Request) {
  try {
    const { assembly, password } = await request.json();

    if (!assembly || !password) {
      return NextResponse.json(
        { error: 'Assembly and password are required' },
        { status: 400 }
      );
    }

    if (
      assemblies.includes(assembly) &&
      assembly.toLowerCase() === password.toLowerCase()
    ) {
      // In a real app, generate a JWT or session token
      return NextResponse.json({
        success: true,
        message: 'Login successful',
        // Example: token: 'your-jwt-token'
      });
    }

    return NextResponse.json(
      { error: 'Invalid assembly or password' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}