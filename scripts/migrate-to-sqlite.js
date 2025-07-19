#!/usr/bin/env node

const fs = require('fs');
const Database = require('better-sqlite3');
const path = require('path');

async function migrateToSQLite() {
    const dataPath = path.join(__dirname, '../data');
    const jsonFile = path.join(dataPath, 'burrito-dev.db');
    const sqliteFile = path.join(dataPath, 'burrito-dev.sqlite');
    
    // Backup existing file
    const backupFile = path.join(dataPath, `burrito-dev.db.backup.${Date.now()}`);
    if (fs.existsSync(jsonFile)) {
        fs.copyFileSync(jsonFile, backupFile);
        console.log(`✅ Backed up existing data to: ${backupFile}`);
    }
    
    // Create SQLite database
    const db = new Database(sqliteFile);
    
    // Create schema
    db.exec(`
        CREATE TABLE IF NOT EXISTS burritos (
            id TEXT PRIMARY KEY,
            to_user TEXT NOT NULL,
            from_user TEXT NOT NULL,
            value INTEGER NOT NULL,
            given_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_to_user ON burritos(to_user);
        CREATE INDEX IF NOT EXISTS idx_from_user ON burritos(from_user);
        CREATE INDEX IF NOT EXISTS idx_given_at ON burritos(given_at);
    `);
    
    // Migrate data if JSON file exists
    if (fs.existsSync(jsonFile)) {
        const jsonData = fs.readFileSync(jsonFile, 'utf8');
        const lines = jsonData.trim().split('\n').filter(line => line.trim());
        
        const insert = db.prepare(`
            INSERT OR REPLACE INTO burritos (id, to_user, from_user, value, given_at)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const transaction = db.transaction((records) => {
            for (const line of records) {
                try {
                    const record = JSON.parse(line);
                    insert.run(
                        record._id,
                        record.to,
                        record.from,
                        record.value,
                        record.given_at
                    );
                } catch (err) {
                    console.warn(`⚠️  Skipped invalid record: ${line}`);
                }
            }
        });
        
        transaction(lines);
        console.log(`✅ Migrated ${lines.length} records to SQLite`);
    }
    
    // Verify migration
    const count = db.prepare('SELECT COUNT(*) as count FROM burritos').get();
    console.log(`✅ Database contains ${count.count} records`);
    
    db.close();
    console.log(`✅ Migration complete! Database: ${sqliteFile}`);
}

migrateToSQLite().catch(console.error);