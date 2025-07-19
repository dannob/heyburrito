import * as log from 'bog';
import fs from 'fs';
import path from 'path';
import UserInterface from '../types/User.interface';

const root: string = path.normalize(`${__dirname}/../../`);
const themeRootPath: string = `${root}www/themes/`;
const defaultTheme: string = 'https://github.com/chralp/heyburrito-theme';


const time = (period: string = 'day') => {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (period) {
        case 'day':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'week':
            const dayOfWeek = now.getDay();
            const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday start
            start.setDate(now.getDate() - daysToSubtract);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            end.setMonth(end.getMonth() + 1, 0); // Last day of current month
            end.setHours(23, 59, 59, 999);
            break;
        default:
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
    }

    return {
        start,
        end,
    };
};

const sort = (input: UserInterface[], sortType: string = 'desc'): UserInterface[] => {
    const sorted = input.sort((a, b) => {
        if (a.score) {
            if (sortType === 'desc') return b.score - a.score;
            return a.score - b.score;
        } else {
            if (sortType === 'desc') return b.scoreinc - a.scoreinc;
            return a.scoreinc - b.scoreinc;
        }
    });
    return sorted;
};

const env: string = process.env.NODE_ENV || 'development';

const fixPath = (p: string): string => {
    if (!p.startsWith('/')) return `/${p}`;
    if (!p.endsWith('/')) return `${p}/`;
    return p;
};

const pathExists = (inPath: string) => {
    try {
        log.debug('Checking if path exists', inPath);
        return fs.lstatSync(inPath).isDirectory();
    } catch (e) {
        return false;
    }
};

const createPath = (inPath: string) => {
    try {
        log.debug(`Trying to create path ${inPath}`);
        fs.mkdirSync(inPath);
        const exists = pathExists(inPath);
        if (exists) return true;
        throw new Error('Neit');
    } catch (e) {
        log.debug(`Could not create path ${inPath}`);
        return false;
    }
};

const mustHave = (key: string) => {
    if (env === 'development' || env === 'testing') return process.env[key];
    if (!process.env[key]) throw new Error(`Missing ENV ${key}`);
    return process.env[key];
};

const getThemeName = () => {
    if (process.env.THEME_PATH) {
        const themePath = process.env.THEME_PATH;
        const [themeName] = themePath.split('/').slice(-1);
        return themeName;
    }
    const theme = process.env.THEME_URL || defaultTheme;
    const [themeName] = theme.split('/').slice(-1);
    return themeName;
};

const getThemePath = () => {
    if (process.env.THEME_PATH) {
        const themePath = process.env.THEME_PATH;
        if (themePath.endsWith('/')) return themePath;
        return `${themePath}/`;
    }

    const themeName = getThemeName();
    return `${themeRootPath}${themeName}/`;
};

export {
    time,
    sort,
    mustHave,
    fixPath,
    env,
    pathExists,
    createPath,
    themeRootPath,
    defaultTheme,
    root,
    getThemePath,
    getThemeName,
};
