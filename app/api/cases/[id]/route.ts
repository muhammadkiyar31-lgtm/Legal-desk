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

    const clientId = String(body.clientId || "").trim();
    const caseNumber = String(body.caseNumber || "").trim();
    const title = String(body.title || "").trim();
    const category = String(body.category || "").trim();
    const description = String(body.description || "").trim();
    const status = String(body.status || "Active").trim();
    const notes = String(body.notes || "").trim();

    if (!clientId || !caseNumber || !title) {
      return NextResponse.json(
        { message: "Client, case number and title are required." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      UPDATE cases
      SET
        client_id = $1,
        case_number = $2,
        title = $3,
        category = $4,
        description = $5,
        status = $6,
        notes = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING
        id,
        client_id AS "clientId",
        case_number AS "caseNumber",
        title,
        category,
        description,
        status,
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        clientId,
        caseNumber,
        title,
        category,
        description,
        status,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Case not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: result.rows[0],
    });
  } catch (error) {
    console.error("PUT case error:", error);

    return NextResponse.json(
      { message: "Failed to update case." },
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
      "DELETE FROM cases WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Case not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE case error:", error);

    return NextResponse.json(
      { message: "Failed to delete case." },
      { status: 500 }
    );
  }
}