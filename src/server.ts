import dotenv from 'dotenv';
/* eslint-disable import/first */
dotenv.config();
import log from 'bog';
import http from 'http';
import BurritoStore from './store/BurritoStore';
import LocalStore from './store/LocalStore';
import database from './database';
import config from './config';
import { start } from './bot';
import slack from './slack';
import Events from './slack/Events';
import WBCHandler from './slack/Wbc';
import APIHandler from './api';
import WEBHandler from './web';
import WSSHandler from './wss';
import boot from './lib/boot';

const init = async () => {
    await boot();
};

init().then(() => {
    log.info('Staring heyburrito');

    // Configure BurritoStore
    BurritoStore.setDatabase(database);

    // Set up slack services
    const { wbc } = slack;

    WBCHandler.register(wbc);

    // Start bot instance
    start();

    // Start localstore instance
    LocalStore.start();

    /**
     * Slack Events API webhook handler
     */
    const handleSlackEvents = (request: http.IncomingMessage, response: http.ServerResponse) => {
        let body = '';
        
        request.on('data', chunk => {
            body += chunk.toString();
        });
        
        request.on('end', () => {
            try {
                const signature = request.headers['x-slack-signature'] as string;
                const timestamp = request.headers['x-slack-request-timestamp'] as string;
                
                if (!Events.verifySlackRequest(body, signature, timestamp)) {
                    response.writeHead(401);
                    return response.end('Unauthorized');
                }
                
                const payload = JSON.parse(body);
                const result = Events.handleEvent(payload);
                
                response.writeHead(200, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify(result));
            } catch (error) {
                log.error('Error handling Slack event:', error);
                response.writeHead(500);
                response.end('Internal Server Error');
            }
        });
    };

    /**
     * Httpserver request handler
     */
    const requestHandler = (request: http.IncomingMessage, response: http.ServerResponse) => {
        /**
         * Handle Slack Events API webhook
         */
        if (request.url === '/slack/events' && request.method === 'POST') {
            return handleSlackEvents(request, response);
        }
        /**
         * Check if request url contains api path, then let APIHandler take care of it
         */
        if (request.url.includes(config.http.api_path)) return APIHandler(request, response);
        /**
         * Check if request url contains webpath, then let WEBHandler take care of it
         */
        if (request.url.includes(config.http.web_path)) return WEBHandler(request, response);
        /**
         * redirect all other requests to webPath
         */
        response.writeHead(301, {
            location: config.http.web_path,
        });
        return response.end();
    };

    /**
     * Start HTTP / WSS server
     */
    const httpserver = http.createServer(requestHandler);

    httpserver.listen(config.http.http_port, (err) => {
        if (err) throw new Error(`Could not start HTTP server, error => ${err}`);
        // Start WSS instance
        WSSHandler();
        log.info(`HttpServer started on ${config.http.http_port}`);
    });
});
