import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const result = await db.query(
      `
      SELECT
        a.id,
        a.article_number AS "articleNumber",
        a.title,
        a.law_name AS "lawName",
        a.jurisdiction,
        a.content,
        a.description
      FROM case_articles ca
      INNER JOIN legal_articles a
        ON a.id = ca.article_id
      WHERE ca.case_id = $1
      ORDER BY a.article_number
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      articles: result.rows,
    });
  } catch (error) {
    console.error("GET case articles error:", error);

    return NextResponse.json(
      { message: "Failed to load case articles." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const articleIds = Array.isArray(body.articleIds)
      ? body.articleIds.map(String)
      : [];

    if (articleIds.length === 0) {
      return NextResponse.json(
        { message: "At least one article is required." },
        { status: 400 }
      );
    }

    const caseCheck = await db.query(
      "SELECT id FROM cases WHERE id = $1",
      [id]
    );

    if (caseCheck.rows.length === 0) {
      return NextResponse.json(
        { message: "Case not found." },
        { status: 404 }
      );
    }

    await db.query(
      `
      DELETE FROM case_articles
      WHERE case_id = $1
      `,
      [id]
    );

    for (const articleId of articleIds) {
      await db.query(
        `
        INSERT INTO case_articles (
          case_id,
          article_id
        )
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        `,
        [id, articleId]
      );
    }

    const result = await db.query(
      `
      SELECT
        a.id,
        a.article_number AS "articleNumber",
        a.title,
        a.law_name AS "lawName",
        a.jurisdiction,
        a.content,
        a.description
      FROM case_articles ca
      INNER JOIN legal_articles a
        ON a.id = ca.article_id
      WHERE ca.case_id = $1
      ORDER BY a.article_number
      `,
      [id]
    );

    return NextResponse.json({
      success: true,
      articles: result.rows,
    });
  } catch (error) {
    console.error("POST case articles error:", error);

    return NextResponse.json(
      { message: "Failed to save case articles." },
      { status: 500 }
    );
  }
}