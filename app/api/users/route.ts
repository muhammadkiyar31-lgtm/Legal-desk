import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        id,
        name,
        email,
        role,
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      users: result.rows,
    });
  } catch (error) {
    console.error("GET users error:", error);

    return NextResponse.json(
      { message: "Failed to load users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "Assistant").trim();

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const allowedRoles = ["Lawyer", "Manager", "Assistant"];

    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { message: "Invalid user role." },
        { status: 400 }
      );
    }

    const existing = await db.query(
      "SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, 'Active')
      RETURNING
        id,
        name,
        email,
        role,
        status,
        created_at
      `,
      [name, email, passwordHash, role]
    );

    return NextResponse.json(
      {
        success: true,
        user: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST users error:", error);

    return NextResponse.json(
      { message: "Failed to create user." },
      { status: 500 }
    );
  }
}