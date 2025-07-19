import { MongoClient } from 'mongodb';
import config from '../config';
import MongoDBDriver from './drivers/MongoDBDriver';
import GenericDriver from './drivers/GenericDriver';
import SQLiteDriver from './drivers/SQLiteDriver';

export default {
    mongodb: (conf = config.db) => new MongoDBDriver(MongoClient, conf),
    array: () => new GenericDriver('array'),
    file: () => new GenericDriver('file'),
    sqlite: () => new SQLiteDriver(),
};
