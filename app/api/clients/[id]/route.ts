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

    if (!hasPermission(session, "clients")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to update clients.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const address = String(body.address || "").trim();
    const idNumber = String(body.idNumber || "").trim();
    const notes = String(body.notes || "").trim();

    if (!id || !fullName) {
      return NextResponse.json(
        {
          message: "Client ID and full name are required.",
        },
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Client not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PUT client error:", error);

    return NextResponse.json(
      {
        message: "Failed to update client.",
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

    if (!hasPermission(session, "clients")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to delete clients.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Client ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      DELETE FROM clients
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Client not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE client error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete client.",
      },
      { status: 500 }
    );
  }
}