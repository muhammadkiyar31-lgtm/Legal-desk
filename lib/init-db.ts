import { db } from "./db";

async function initDatabase() {
  try {
    await db.query(`
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(150) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'Lawyer',
        status VARCHAR(20) NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(200) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        id_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clients_full_name
      ON clients(full_name);

      CREATE INDEX IF NOT EXISTS idx_clients_phone
      ON clients(phone);

      CREATE TABLE IF NOT EXISTS cases (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID NOT NULL
          REFERENCES clients(id)
          ON DELETE CASCADE,
        case_number VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cases_client_id
      ON cases(client_id);

      CREATE INDEX IF NOT EXISTS idx_cases_case_number
      ON cases(case_number);

      CREATE INDEX IF NOT EXISTS idx_cases_status
      ON cases(status);

      CREATE TABLE IF NOT EXISTS legal_articles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        article_number VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        law_name VARCHAR(255) NOT NULL,
        jurisdiction VARCHAR(150),
        content TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_legal_articles_article_number
      ON legal_articles(article_number);

      CREATE INDEX IF NOT EXISTS idx_legal_articles_law_name
      ON legal_articles(law_name);

      CREATE TABLE IF NOT EXISTS case_articles (
        case_id UUID NOT NULL
          REFERENCES cases(id)
          ON DELETE CASCADE,
        article_id UUID NOT NULL
          REFERENCES legal_articles(id)
          ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (case_id, article_id)
      );

      CREATE INDEX IF NOT EXISTS idx_case_articles_case_id
      ON case_articles(case_id);

      CREATE INDEX IF NOT EXISTS idx_case_articles_article_id
      ON case_articles(article_id);

      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        case_id UUID NOT NULL
          REFERENCES cases(id)
          ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        lawyer_name VARCHAR(200) NOT NULL,
        notes TEXT,
        content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_documents_case_id
      ON documents(case_id);

      CREATE INDEX IF NOT EXISTS idx_documents_created_at
      ON documents(created_at);
    `);

    console.log("Database tables initialized successfully.");
  } catch (error) {
    console.error("Database initialization failed:", error);
    process.exit(1);
  } finally {
    await db.end();
  }
}

initDatabase();