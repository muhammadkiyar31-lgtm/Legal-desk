import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  try {
    const session = await getSession();

    if (!hasPermission(session, "articles")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to access legal articles.",
        },
        { status: 403 }
      );
    }

    const result = await db.query(`
      SELECT
        id,
        article_number AS "articleNumber",
        title,
        law_name AS "lawName",
        jurisdiction,
        content,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM legal_articles
      ORDER BY created_at DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET articles error:", error);

    return NextResponse.json(
      {
        message: "Failed to load legal articles.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!hasPermission(session, "articles")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to create legal articles.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const articleNumber = String(
      body.articleNumber || ""
    ).trim();

    const title = String(body.title || "").trim();

    const lawName = String(
      body.lawName || ""
    ).trim();

    const jurisdiction = String(
      body.jurisdiction || ""
    ).trim();

    const content = String(
      body.content || ""
    ).trim();

    const description = String(
      body.description || ""
    ).trim();

    if (
      !articleNumber ||
      !title ||
      !lawName ||
      !content
    ) {
      return NextResponse.json(
        {
          message:
            "Article number, title, law name and content are required.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      INSERT INTO legal_articles (
        article_number,
        title,
        law_name,
        jurisdiction,
        content,
        description
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        article_number AS "articleNumber",
        title,
        law_name AS "lawName",
        jurisdiction,
        content,
        description,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      `,
      [
        articleNumber,
        title,
        lawName,
        jurisdiction || null,
        content,
        description || null,
      ]
    );

    return NextResponse.json(
      result.rows[0],
      { status: 201 }
    );
  } catch (error) {
    console.error("POST articles error:", error);

    return NextResponse.json(
      {
        message: "Failed to create legal article.",
      },
      { status: 500 }
    );
  }
}