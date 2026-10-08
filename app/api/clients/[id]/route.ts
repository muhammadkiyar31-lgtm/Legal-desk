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

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();
    const idNumber = String(body.idNumber || "").trim();
    const notes = String(body.notes || "").trim();

    if (!fullName) {
      return NextResponse.json(
        { message: "Full name is required." },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      UPDATE clients
      SET
        full_name = $1,
        phone = $2,
        email = $3,
        address = $4,
        id_number = $5,
        notes = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING
        id,
        full_name AS "fullName",
        phone,
        email,
        address,
        id_number AS "idNumber",
        notes,
        created_at AS "createdAt"
      `,
      [
        fullName,
        phone,
        email,
        address,
        idNumber,
        notes,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Client not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client: result.rows[0],
    });
  } catch (error) {
    console.error("PUT client error:", error);

    return NextResponse.json(
      { message: "Failed to update client." },
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
      "DELETE FROM clients WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Client not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE client error:", error);

    return NextResponse.json(
      { message: "Failed to delete client." },
      { status: 500 }
    );
  }
}