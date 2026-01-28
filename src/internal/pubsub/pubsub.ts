import type { Channel, ChannelModel, ConfirmChannel } from "amqplib";
import ampq from "amqplib";
import { DeadLetterKey, ExchangeDeadLetter } from "../routing/routing.js";

export enum Acktype {
    Ack,
    NackRequeue,
    NackDiscard
}

export function publishJSON<T>(
    ch: ConfirmChannel,
    exchange: string,
    routingKey: string,
    value: T
): Promise<void> {
    return new Promise((res) => {
        const content = Buffer.from(JSON.stringify(value));
        ch.publish(exchange, routingKey, content, {
            contentType: "application/json"
        },
            () => res()
        );
    })
}

type SimpleQueueType = 'durable' | 'transient'

export async function declareAndBind(
    conn: ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
): Promise<[Channel, ampq.Replies.AssertQueue]> {
    const qOptions:ampq.Options.AssertQueue = {
        durable: queueType === 'durable',
        autoDelete: queueType === 'transient',
        exclusive: queueType === 'transient',
        deadLetterExchange: ExchangeDeadLetter,
        deadLetterRoutingKey: DeadLetterKey,
    };

    const channel = await conn.createChannel();
    const Q = await channel.assertQueue(queueName, qOptions);
    await channel.bindQueue(queueName, exchange, key);

    return [channel, Q]    
}

export async function subscribeJSON<T>(
    conn: ChannelModel,
    exchange: string,
    queueName: string,
    key: string,
    queueType: SimpleQueueType,
    handler: (data: T) => Acktype,
): Promise<void> {
    const [channel, Q] = await declareAndBind(conn, exchange, queueName, key, queueType);
    const consume = await channel
        .consume(queueName, callback)
        .catch(e => console.error('FAILED TO CONSUME'))

    function callback(msg: ampq.ConsumeMessage | null) {
        if (!msg) return;
        const data = JSON.parse(String(msg.content));
        const ack = handler(data);
        switch (ack) {
            case Acktype.Ack:
                channel.ack(msg);
                break;
            case Acktype.NackDiscard:
                channel.nack(msg, false, false);
                break;
            case Acktype.NackRequeue:
                channel.nack(msg, false, true);
                break;
            default: throw new Error('Undefined AckType');
        }
    }
}