import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
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

    return NextResponse.json({
      success: true,
      articles: result.rows,
    });
  } catch (error) {
    console.error("GET articles error:", error);

    return NextResponse.json(
      { message: "Failed to load legal articles." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const articleNumber = String(body.articleNumber || "").trim();
    const title = String(body.title || "").trim();
    const lawName = String(body.lawName || "").trim();
    const jurisdiction = String(body.jurisdiction || "").trim();
    const content = String(body.content || "").trim();
    const description = String(body.description || "").trim();

    if (!articleNumber || !title || !lawName || !content) {
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
        jurisdiction,
        content,
        description,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        article: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST articles error:", error);

    return NextResponse.json(
      { message: "Failed to create legal article." },
      { status: 500 }
    );
  }
}