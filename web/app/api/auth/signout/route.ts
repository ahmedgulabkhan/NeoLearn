/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { signOut } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await signOut()

    const response = NextResponse.json({ success: true })
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sign out failed' },
      { status: 400 }
    )
  }
}
