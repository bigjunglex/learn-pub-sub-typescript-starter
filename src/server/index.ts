import ampq from "amqplib";
import { declareAndBind, publishJSON } from "../internal/pubsub/pubsub.js";
import { ExchangePerilDirect, ExchangePerilTopic, GameLogSlug, PauseKey } from "../internal/routing/routing.js";
import { getInput, printServerHelp } from "../internal/gamelogic/gamelogic.js";

process.loadEnvFile();
const RMQ_URL = process.env.RMQ_PORT ?? 'amqp://guest:guest@localhost:5672/';
const lp = '[SERVER]: ';

async function main() {
    console.log("Starting Peril server...");
    const conn = await ampq.connect(RMQ_URL);
    printServerHelp();
    console.log(lp,"RMQ connected ")

    const channel = await conn.createConfirmChannel()
    const [topic, Q] = await declareAndBind(
        conn,
        ExchangePerilTopic,
        GameLogSlug,
        `${GameLogSlug}.*`,
        'durable'
    );

    process.on('SIGINT', () => {
        console.log("Shutting down Peril server...");
        conn.close();
    })

    while (true) {
        const input = await getInput('[NEXT MOVE]');
        if (!input.length ) continue;

        const w = input[0];

        if (w === PauseKey) {
            console.log(lp, 'Pausing the game');
            const value = { isPaused: true }
            await publishJSON(channel, ExchangePerilDirect, PauseKey, value);
            continue;
        };

        if (w === 'resume') {
            console.log(lp, 'Resuming the game');
            const value = { isPaused: false }
            await publishJSON(channel, ExchangePerilDirect, PauseKey, value);
            continue;
        }

        if (w === 'quit') {
            console.log(lp, 'Exiting the game');
            process.exit(0)
            break;
        }
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
