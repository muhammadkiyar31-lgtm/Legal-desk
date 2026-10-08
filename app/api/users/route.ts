import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await getSession();

    if (!hasPermission(session, "users")) {
      return NextResponse.json(
        {
          message: "You do not have permission to access users.",
        },
        { status: 403 }
      );
    }

    const result = await db.query(`
      SELECT
        id,
        name,
        email,
        role,
        status,
        created_at AS "createdAt"
      FROM users
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET users error:", error);

    return NextResponse.json(
      {
        message: "Failed to load users.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "users")) {
      return NextResponse.json(
        {
          message: "You do not have permission to manage users.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "Lawyer").trim();

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          message:
            "Name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    const allowedRoles = [
      "Lawyer",
      "Manager",
      "Assistant",
    ];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        {
          message: "Invalid user role.",
        },
        { status: 400 }
      );
    }

    const existingUser = await db.query(
      `
      SELECT id
      FROM users
      WHERE LOWER(email) = $1
      LIMIT 1
      `,
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        {
          message:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const result = await db.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        name,
        email,
        role,
        status,
        created_at AS "createdAt"
      `,
      [
        name,
        email,
        passwordHash,
        role,
        "Active",
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (error) {
    console.error("POST users error:", error);

    return NextResponse.json(
      {
        message: "Failed to create user.",
      },
      { status: 500 }
    );
  }
}