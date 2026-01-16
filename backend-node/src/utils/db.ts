import sqlite3 from 'sqlite3';
import path from 'path';

// Open database in the root directory (or wherever appropriate)
const dbPath = path.resolve(__dirname, '../../rag_feedback.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database at', dbPath);
    }
});

export function initDb() {
    db.serialize(() => {
        // Queries table
        db.run(`CREATE TABLE IF NOT EXISTS queries (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            timestamp INTEGER NOT NULL
        )`);

        // Hops table
        db.run(`CREATE TABLE IF NOT EXISTS hops (
            id TEXT PRIMARY KEY,
            query_id TEXT NOT NULL,
            hop_order INTEGER NOT NULL,
            sub_query TEXT NOT NULL,
            reasoning TEXT,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY(query_id) REFERENCES queries(id)
        )`);

        // Hop Documents table
        // Note: document_id corresponds to the Pinecone ID or Doc ID
        db.run(`CREATE TABLE IF NOT EXISTS hop_documents (
            id TEXT PRIMARY KEY,
            hop_id TEXT NOT NULL,
            document_id TEXT NOT NULL,
            dense_score REAL,
            sparse_score REAL,
            feedback_score REAL DEFAULT 0,
            rank_position INTEGER,
            FOREIGN KEY(hop_id) REFERENCES hops(id)
        )`);

        // Responses table
        db.run(`CREATE TABLE IF NOT EXISTS responses (
            id TEXT PRIMARY KEY,
            query_id TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp INTEGER NOT NULL,
            user_feedback INTEGER DEFAULT 0,
            user_correction TEXT,
            FOREIGN KEY(query_id) REFERENCES queries(id)
        )`);

        // Evidence Chains table (validated reasoning paths)
        db.run(`CREATE TABLE IF NOT EXISTS evidence_chains (
            id TEXT PRIMARY KEY,
            response_id TEXT NOT NULL,
            hop_ids TEXT NOT NULL,
            document_ids TEXT NOT NULL,
            confidence_score REAL,
            FOREIGN KEY(response_id) REFERENCES responses(id)
        )`);

        console.log("Database tables initialized.");
    });
}

// Helper to run queries as Promises
export function run(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve();
        });
    });
}

export function get(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

export function all(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

export default db;
