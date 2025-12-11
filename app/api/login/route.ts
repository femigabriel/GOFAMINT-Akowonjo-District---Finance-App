// app/api/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { assemblies } from '@/lib/assemblies';
import { v4 as uuidv4 } from 'uuid';

// In production, use environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, assembly, loginType } = body;

    // Generate unique tokens
    const generateToken = () => {
      return `auth_${uuidv4()}_${Date.now()}`;
    };

    if (loginType === 'admin') {
      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        // Generate admin token
        const adminToken = generateToken();
        
        return NextResponse.json({ 
          success: true, 
          role: 'admin',
          token: adminToken,
          userData: {
            email: ADMIN_EMAIL,
            role: 'admin'
          },
          redirect: '/admin/dashboard' 
        });
      }
    }
    
    if (loginType === 'assembly' && assembly && password) {
      // Normalize inputs to lowercase for case-insensitive comparison
      const normalizedAssembly = assembly.trim();
      const normalizedPassword = password.trim();
      
      // Find the assembly with case-insensitive matching
      const foundAssembly = assemblies.find(
        a => a.toLowerCase() === normalizedAssembly.toLowerCase()
      );
      
      // Check if assembly exists and password matches (case-insensitive)
      if (foundAssembly && normalizedPassword.toLowerCase() === foundAssembly.toLowerCase()) {
        // Use the original case assembly name from the assemblies array
        const correctCaseAssembly = foundAssembly;
        
        // Generate assembly token
        const assemblyToken = generateToken();
        
        return NextResponse.json({ 
          success: true, 
          role: 'assembly',
          token: assemblyToken,
          userData: {
            assembly: correctCaseAssembly,
            role: 'assembly'
          },
          redirect: '/dashboard'
        });
      }
    }

    return NextResponse.json(
      { success: false, message: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}