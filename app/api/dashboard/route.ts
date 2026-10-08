import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          message: "Authentication required.",
        },
        {
          status: 401,
        }
      );
    }

    const result = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM clients) AS "totalClients",

        (
          SELECT COUNT(*)::int
          FROM cases
          WHERE status = 'Active'
        ) AS "activeCases",

        (
          SELECT COUNT(*)::int
          FROM legal_articles
        ) AS "legalArticles",

        (
          SELECT COUNT(*)::int
          FROM documents
        ) AS "documents",

        (
          SELECT COUNT(*)::int
          FROM cases
          WHERE status = 'Closed'
        ) AS "closedCases"
    `);

    const recentCases = await db.query(`
      SELECT
        c.id,
        c.case_number AS "caseNumber",
        c.title,
        c.category,
        c.status,
        c.created_at AS "createdAt",
        cl.full_name AS "clientName"
      FROM cases c
      INNER JOIN clients cl
        ON cl.id = c.client_id
      ORDER BY c.created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({
      success: true,
      stats: result.rows[0],
      recentCases: recentCases.rows,
    });
  } catch (error) {
    console.error("GET dashboard error:", error);

    return NextResponse.json(
      {
        message: "Failed to load dashboard data.",
      },
      {
        status: 500,
      }
    );
  }
}