import type { Channel, ChannelModel, ConfirmChannel } from "amqplib";
import ampq from "amqplib";

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
    };
    
    const channel = await conn.createChannel();
    const Q = await channel.assertQueue(queueName, qOptions);
    await channel.bindQueue(queueName, exchange, key);

    return [channel, Q]    
}