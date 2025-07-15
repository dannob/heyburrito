import * as log from 'bog';
import { EventEmitter } from 'events';
import crypto from 'crypto';
import config from '../config';

interface SlackEvent {
    type: string;
    text: string;
    user: string;
    client_msg_id?: string;
    suppress_notification?: boolean;
    team?: string;
    channel?: string;
    event_ts?: string;
    ts?: string;
    subtype?: string;
}

interface SlackEventPayload {
    token?: string;
    challenge?: string;
    type: string;
    event?: SlackEvent;
    team_id?: string;
    api_app_id?: string;
    event_id?: string;
    event_time?: number;
}

class Events extends EventEmitter {
    private signingSecret: string;

    constructor() {
        super();
        this.signingSecret = process.env.SLACK_SIGNING_SECRET || '';
    }

    verifySlackRequest(body: string, signature: string, timestamp: string): boolean {
        if (!this.signingSecret) {
            log.warn('SLACK_SIGNING_SECRET not configured, skipping verification');
            return true;
        }

        const time = Math.floor(new Date().getTime() / 1000);
        if (Math.abs(time - parseInt(timestamp)) > 300) {
            log.warn('Request timestamp too old');
            return false;
        }

        const sigBasestring = `v0:${timestamp}:${body}`;
        const mySignature = `v0=${crypto
            .createHmac('sha256', this.signingSecret)
            .update(sigBasestring, 'utf8')
            .digest('hex')}`;

        return crypto.timingSafeEqual(
            Buffer.from(mySignature, 'utf8'),
            Buffer.from(signature, 'utf8')
        );
    }

    handleEvent(payload: SlackEventPayload): any {
        // Handle URL verification challenge
        if (payload.type === 'url_verification') {
            return { challenge: payload.challenge };
        }

        // Handle event callbacks
        if (payload.type === 'event_callback' && payload.event) {
            const event = payload.event;
            
            // Log channel join events
            if (event.subtype === 'channel_join') {
                log.info('Joined channel', event.channel);
            }

            // Emit message events for bot processing
            if (event.type === 'message') {
                this.emit('slackMessage', event);
            }
        }

        return { status: 'ok' };
    }
}

export default new Events();