import ampq from "amqplib";
import { clientWelcome } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind } from "../internal/pubsub/pubsub.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
process.loadEnvFile();


const RMQ_URL = process.env.RMQ_PORT ?? 'amqp://guest:guest@localhost:5672/';
const lp = '[CLIENT]: ';

async function main() {
    console.log("Starting Peril client...");
    const conn = await ampq.connect(RMQ_URL);
    console.log(lp, "RMQ connected");
    
    const username = await clientWelcome();
    const qName = `${PauseKey}.${username}`

    await declareAndBind(conn, ExchangePerilDirect, qName, PauseKey, 'transient');

}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
