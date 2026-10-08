import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "documents")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to update documents.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const caseId = String(body.caseId || "").trim();
    const title = String(body.title || "").trim();
    const lawyerName = String(
      body.lawyerName || ""
    ).trim();
    const notes = String(body.notes || "").trim();
    const content = String(body.content || "").trim();

    if (!id || !caseId || !title || !lawyerName) {
      return NextResponse.json(
        {
          message:
            "Document ID, case, title and lawyer name are required.",
        },
        { status: 400 }
      );
    }

    const caseResult = await db.query(
      `
      SELECT id
      FROM cases
      WHERE id = $1
      LIMIT 1
      `,
      [caseId]
    );

    if (caseResult.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Case not found.",
        },
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
        notes || null,
        content || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PUT document error:", error);

    return NextResponse.json(
      {
        message: "Failed to update document.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "documents")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to delete documents.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Document ID is required.",
        },
        { status: 400 }
      );
    }

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
        {
          message: "Document not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE document error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete document.",
      },
      { status: 500 }
    );
  }
}