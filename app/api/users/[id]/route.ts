import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "users")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to manage users.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const status = String(body.status || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    if (!["Active", "Inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Invalid user status.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      UPDATE users
      SET
        status = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING
        id,
        name,
        email,
        role,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [status, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PATCH user error:", error);

    return NextResponse.json(
      {
        message: "Failed to update user.",
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

    if (!hasPermission(session, "users")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to delete users.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "User ID is required.",
        },
        { status: 400 }
      );
    }

    if (session?.id === id) {
      return NextResponse.json(
        {
          message:
            "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING
        id,
        name,
        email,
        role,
        status
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE user error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete user.",
      },
      { status: 500 }
    );
  }
}