import Database = require('better-sqlite3');
import { time } from '../../lib/utils';
import path from 'path';
import config from '../../config';

interface Find {
    _id: string;
    to: string;
    from: string;
    value: number;
    given_at: Date;
}

interface Sum {
    _id: string;
    total: number;
}

class SQLiteDriver {
    private db: any;
    private dbPath: string;

    constructor() {
        this.dbPath = path.resolve(`${config.db.db_path}${config.db.db_fileName}`);
        this.init();
    }

    private init() {
        this.db = new Database(this.dbPath);
        
        // Create schema if not exists
        this.db.exec(`
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
    }

    async getScoreBoard({ user, listType, today, period }): Promise<Find[]> {
        let whereClause = 'WHERE 1=1';
        const params: any[] = [];

        // Time filtering
        if (today || period) {
            const timeRange = period ? time(period) : time();
            whereClause += ' AND given_at BETWEEN ? AND ?';
            params.push(timeRange.start.toISOString(), timeRange.end.toISOString());
        }

        // User filtering logic (matching GenericDriver behavior)
        let listTypeSwitch: string;
        if (user) {
            listTypeSwitch = (listType === 'from') ? 'to_user' : 'from_user';
            whereClause += ` AND ${listTypeSwitch} = ?`;
            params.push(user);
        }

        const query = `
            SELECT id as _id, to_user as "to", from_user as "from", value, given_at
            FROM burritos 
            ${whereClause}
            ORDER BY given_at DESC
        `;

        const rows = this.db.prepare(query).all(...params);
        
        // Convert given_at back to Date objects to match interface
        const result = rows.map(row => ({
            ...row,
            given_at: new Date(row.given_at)
        }));
        
        return result;
    }

    async getUserStats(userId: string) {
        const userQuery = `
            SELECT 
                ? as username,
                COALESCE(SUM(CASE WHEN to_user = ? THEN value ELSE 0 END), 0) as received,
                COALESCE(SUM(CASE WHEN from_user = ? THEN value ELSE 0 END), 0) as given,
                COALESCE(SUM(CASE WHEN to_user = ? AND date(given_at) = date('now') THEN value ELSE 0 END), 0) as receivedToday,
                COALESCE(SUM(CASE WHEN from_user = ? AND date(given_at) = date('now') THEN value ELSE 0 END), 0) as givenToday
            FROM burritos 
            WHERE to_user = ? OR from_user = ?
        `;

        const userStats = this.db.prepare(userQuery).get(
            userId, userId, userId, userId, userId, userId, userId
        ) || {
            username: userId,
            received: 0,
            given: 0,
            receivedToday: 0,
            givenToday: 0
        };

        return userStats;
    }

    async getUserScoreToday({ user, listType }) {
        const timeRange = time();
        let whereClause = 'WHERE given_at BETWEEN ? AND ?';
        const params = [timeRange.start.toISOString(), timeRange.end.toISOString()];

        if (listType === 'to') {
            whereClause += ' AND to_user = ?';
        } else {
            whereClause += ' AND from_user = ?';
        }
        params.push(user);

        const targetColumn = listType === 'to' ? 'from_user' : 'to_user';
        
        const query = `
            SELECT ${targetColumn} as _id, SUM(value) as total
            FROM burritos 
            ${whereClause}
            GROUP BY ${targetColumn}
        `;

        return this.db.prepare(query).all(...params);
    }

    async store(data: any) {
        const insert = this.db.prepare(`
            INSERT INTO burritos (id, to_user, from_user, value, given_at)
            VALUES (?, ?, ?, ?, ?)
        `);

        insert.run(
            data._id,
            data.to,
            data.from,
            data.value,
            data.given_at
        );

        return data;
    }

    async give(to: string, from: string, date: any): Promise<any> {
        const id = `_${Math.random().toString(36).substr(2, 9)}`;
        const record = {
            _id: id,
            to,
            from,
            value: 1,
            given_at: date.toISOString()
        };
        
        return this.store(record);
    }

    async takeAway(to: string, from: string, date: any): Promise<any> {
        const id = `_${Math.random().toString(36).substr(2, 9)}`;
        const record = {
            _id: id,
            to,
            from,
            value: -1,
            given_at: date.toISOString()
        };
        
        return this.store(record);
    }

    async getScore(user: string, listType: string, num = false): Promise<number | Find[]> {
        const column = listType === 'to' ? 'to_user' : 'from_user';
        
        if (num) {
            const query = `SELECT COALESCE(SUM(value), 0) as total FROM burritos WHERE ${column} = ?`;
            const result = this.db.prepare(query).get(user);
            return result.total;
        } else {
            const query = `SELECT id as _id, to_user as "to", from_user as "from", value, given_at FROM burritos WHERE ${column} = ? ORDER BY given_at DESC`;
            const rows = this.db.prepare(query).all(user);
            return rows.map(row => ({
                ...row,
                given_at: new Date(row.given_at)
            }));
        }
    }

    async findFromToday(user: string, listType: string): Promise<Find[]> {
        const timeRange = time();
        const column = listType === 'to' ? 'to_user' : 'from_user';
        
        const query = `
            SELECT id as _id, to_user as "to", from_user as "from", value, given_at 
            FROM burritos 
            WHERE ${column} = ? AND given_at BETWEEN ? AND ?
            ORDER BY given_at DESC
        `;
        
        const rows = this.db.prepare(query).all(
            user, 
            timeRange.start.toISOString(), 
            timeRange.end.toISOString()
        );
        
        return rows.map(row => ({
            ...row,
            given_at: new Date(row.given_at)
        }));
    }

    async findFromPeriod(user: string, listType: string, period: string = 'day'): Promise<Find[]> {
        const timeRange = time(period);
        const column = listType === 'to' ? 'to_user' : 'from_user';
        
        const query = `
            SELECT id as _id, to_user as "to", from_user as "from", value, given_at 
            FROM burritos 
            WHERE ${column} = ? AND given_at BETWEEN ? AND ?
            ORDER BY given_at DESC
        `;
        
        const rows = this.db.prepare(query).all(
            user, 
            timeRange.start.toISOString(), 
            timeRange.end.toISOString()
        );
        
        return rows.map(row => ({
            ...row,
            given_at: new Date(row.given_at)
        }));
    }

    close() {
        if (this.db) {
            this.db.close();
        }
    }
}

export default SQLiteDriver;