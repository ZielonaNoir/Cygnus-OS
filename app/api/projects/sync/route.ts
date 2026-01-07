import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    message: 'Project sync API',
    status: 'ok',
  });
}

