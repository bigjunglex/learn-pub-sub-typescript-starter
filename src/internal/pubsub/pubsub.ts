import type { ConfirmChannel } from "amqplib";

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