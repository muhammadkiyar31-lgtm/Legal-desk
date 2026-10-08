import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        d.id,
        d.case_id AS "caseId",
        d.title,
        d.lawyer_name AS "lawyerName",
        d.notes,
        d.content,
        d.created_at AS "createdAt",
        d.updated_at AS "updatedAt",
        c.case_number AS "caseNumber",
        c.title AS "caseTitle",
        cl.full_name AS "clientName"
      FROM documents d
      INNER JOIN cases c
        ON c.id = d.case_id
      INNER JOIN clients cl
        ON cl.id = c.client_id
      ORDER BY d.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    console.error("GET documents error:", error);

    return NextResponse.json(
      { message: "Failed to load documents." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const caseId = String(body.caseId || "").trim();
    const title = String(body.title || "").trim();
    const lawyerName = String(body.lawyerName || "").trim();
    const notes = String(body.notes || "").trim();
    const content = String(body.content || "").trim();

    if (!caseId) {
      return NextResponse.json(
        { message: "Case is required." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { message: "Document title is required." },
        { status: 400 }
      );
    }

    if (!lawyerName) {
      return NextResponse.json(
        { message: "Lawyer name is required." },
        { status: 400 }
      );
    }

    const caseCheck = await db.query(
      "SELECT id FROM cases WHERE id = $1",
      [caseId]
    );

    if (caseCheck.rows.length === 0) {
      return NextResponse.json(
        { message: "Case not found." },
        { status: 404 }
      );
    }

    const result = await db.query(
      `
      INSERT INTO documents (
        case_id,
        title,
        lawyer_name,
        notes,
        content
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        case_id AS "caseId",
        title,
        lawyer_name AS "lawyerName",
        notes,
        content,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        caseId,
        title,
        lawyerName,
        notes,
        content,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        document: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST documents error:", error);

    return NextResponse.json(
      { message: "Failed to create document." },
      { status: 500 }
    );
  }
}