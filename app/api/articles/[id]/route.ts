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

    if (!hasPermission(session, "articles")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to update legal articles.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;
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
      !id ||
      !articleNumber ||
      !title ||
      !lawName ||
      !content
    ) {
      return NextResponse.json(
        {
          message:
            "Article ID, article number, title, law name and content are required.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      UPDATE legal_articles
      SET
        article_number = $1,
        title = $2,
        law_name = $3,
        jurisdiction = $4,
        content = $5,
        description = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
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
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Legal article not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("PUT article error:", error);

    return NextResponse.json(
      {
        message: "Failed to update legal article.",
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

    if (!hasPermission(session, "articles")) {
      return NextResponse.json(
        {
          message:
            "You do not have permission to delete legal articles.",
        },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          message: "Article ID is required.",
        },
        { status: 400 }
      );
    }

    const result = await db.query(
      `
      DELETE FROM legal_articles
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        {
          message: "Legal article not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE article error:", error);

    return NextResponse.json(
      {
        message: "Failed to delete legal article.",
      },
      { status: 500 }
    );
  }
}