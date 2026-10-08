import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await getSession();

    if (!hasPermission(session, "cases")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to access cases.",
        },
        { status: 403 }
      );
    }

    const result = await db.query(`
      SELECT
        c.id,
        c.client_id AS "clientId",
        c.case_number AS "caseNumber",
        c.title,
        c.category,
        c.description,
        c.status,
        c.notes,
        c.created_at AS "createdAt",
        c.updated_at AS "updatedAt",
        cl.full_name AS "clientName"
      FROM cases c
      INNER JOIN clients cl
        ON cl.id = c.client_id
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET cases error:", error);

    return NextResponse.json(
      {
        message: "Failed to load cases.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "cases")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to create cases.",
        },
        { status: 403 }
      );
    }

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
        {
          message:
            "Client, case number and title are required.",
        },
        { status: 400 }
      );
    }

    const clientResult = await db.query(
      `
      SELECT id
      FROM clients
      WHERE id = $1
      LIMIT 1
      `,
      [clientId]
    );

    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Client not found.",
        },
        { status: 404 }
      );
    }

    const result = await db.query(
      `
      INSERT INTO cases (
        client_id,
        case_number,
        title,
        category,
        description,
        status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
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
        category || null,
        description || null,
        status || "Active",
        notes || null,
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (error) {
    console.error("POST cases error:", error);

    return NextResponse.json(
      {
        message: "Failed to create case.",
      },
      { status: 500 }
    );
  }
}