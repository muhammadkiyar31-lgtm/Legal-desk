import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await getSession();

    if (!hasPermission(session, "clients")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to access clients.",
        },
        { status: 403 }
      );
    }

    const result = await db.query(`
      SELECT
        id,
        full_name AS "fullName",
        phone,
        email,
        address,
        id_number AS "idNumber",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM clients
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET clients error:", error);

    return NextResponse.json(
      {
        message: "Failed to load clients.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "clients")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to create clients.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const address = String(body.address || "").trim();
    const idNumber = String(body.idNumber || "").trim();
    const notes = String(body.notes || "").trim();

    if (!fullName) {
      return NextResponse.json(
        {
          message: "Full name is required.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      INSERT INTO clients (
        full_name,
        phone,
        email,
        address,
        id_number,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        full_name AS "fullName",
        phone,
        email,
        address,
        id_number AS "idNumber",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        fullName,
        phone || null,
        email || null,
        address || null,
        idNumber || null,
        notes || null,
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (error) {
    console.error("POST clients error:", error);

    return NextResponse.json(
      {
        message: "Failed to create client.",
      },
      { status: 500 }
    );
  }
}







