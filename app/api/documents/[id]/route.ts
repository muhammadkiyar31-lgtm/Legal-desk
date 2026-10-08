import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
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
      UPDATE documents
      SET
        case_id = $1,
        title = $2,
        lawyer_name = $3,
        notes = $4,
        content = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      document: result.rows[0],
    });
  } catch (error) {
    console.error("PUT document error:", error);

    return NextResponse.json(
      { message: "Failed to update document." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const result = await db.query(
      `
      DELETE FROM documents
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE document error:", error);

    return NextResponse.json(
      { message: "Failed to delete document." },
      { status: 500 }
    );
  }
}