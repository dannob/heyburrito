import * as log from 'bog';
import config from '../config';
import { pathExists, createPath } from './utils';
import themeHandler from './themeHandler';

export default async () => {
    log.level(config.misc.log_level);
    log.debug('Loaded ENVs for boot:');
    log.debug('=====================');
    log.debug('db_driver:', config.db.db_driver);
    log.debug('themeName', config.theme.themeName);

    if (config.theme.path) {
        log.debug('themePath:', config.theme.themePath);
    } else {
        log.debug('themeUrl:', config.theme.url);
    }
    log.debug('=====================');
    await themeHandler();
    
    // Log the database driver being used
    log.info(`Database driver is ${config.db.db_driver}`);
    
    // check if database needs file path (file or sqlite)
    if (config.db.db_driver === 'file' || config.db.db_driver === 'sqlite') {
        // Check if path exists
        if (!pathExists(config.db.db_path)) {
            log.debug('Database path does not exists');

            // Create path
            if (createPath(config.db.db_path)) {
                log.debug('Database path created', config.db.db_path);
            } else {
                // Better error handle here, try to recreate to some default folder ?
                throw new Error('Could not create database path');
            }
        }
    }
    return true;
};
