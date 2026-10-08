import bcrypt from "bcryptjs";
import { db } from "./db";

async function seedUser() {
  const name = "Demo Lawyer";
  const email = "lawyer@legaldesk.com";
  const password = "123456";
  const role = "Lawyer";

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log("Demo Lawyer already exists.");
      return;
    }

    await db.query(
      `
      INSERT INTO users (
        name,
        email,
        password_hash,
        role,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [name, email, passwordHash, role, "Active"]
    );

    console.log("Demo Lawyer created successfully.");
    console.log("Email:", email);
    console.log("Password: 123456");
  } catch (error) {
    console.error("Failed to seed user:", error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

seedUser();