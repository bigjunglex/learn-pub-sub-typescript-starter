import ampq from "amqplib";
import { publishJSON } from "../internal/pubsub/pubsub.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";

process.loadEnvFile();
const RMQ_URL = process.env.RMQ_PORT!;

async function main() {
    console.log("Starting Peril server...");
    const conn = await ampq.connect(RMQ_URL);
    console.log("RMQ connected")

    const channel = await conn.createConfirmChannel()
    const value = { isPaused: true }
    await publishJSON(channel, ExchangePerilDirect, PauseKey, value)

    process.on('SIGINT', () => {
        console.log("Shutting down Peril server...");
        conn.close();
    })
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
