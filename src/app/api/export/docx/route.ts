import { NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

export async function POST(request: Request) {
  try {
    const { html } = await request.json();
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'HTML content is required' }, { status: 400 });
    }

    const docxBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      font: 'Inter',
      fontSize: 24,
    });

    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="note.docx"',
      },
    });
  } catch (e) {
    console.error('DOCX export error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to export DOCX' },
      { status: 500 }
    );
  }
}
