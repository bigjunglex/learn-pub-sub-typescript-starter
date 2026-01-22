import ampq from "amqplib";
import { clientWelcome, commandStatus, getInput, printClientHelp } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, subscribeJSON } from "../internal/pubsub/pubsub.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { handlerPause } from "./handlers.js";
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

    const gamestate = new GameState(username);
    const handler = handlerPause(gamestate)
    
    await subscribeJSON(
        conn,
        ExchangePerilDirect,
        qName,
        PauseKey,
        'transient',
        handler
    )

    while (true) {
        const w = await getInput('[NEXT ACTION]: ');
        const cmd = w[0];

        try {
            if (cmd === 'spawn') {
                commandSpawn(gamestate, w);
            } else if (cmd === 'move') {
                commandMove(gamestate, w);
            } else if (cmd === 'status') {
                commandStatus(gamestate);
            } else if (cmd === 'help') {
                printClientHelp();
            } else if (cmd === 'spam') {
                console.log('Spamming not allowed')
            } else if (cmd === 'quit') {
                console.log('[CLIENT]: closing... ')
                process.exit(0)
            } else {
                throw new Error('Unknow command, refer to [help]')
            }
        } catch (e) {
            console.error(e instanceof Error ? e.message : e)
        }
        continue
    }

}

main().catch((err) => {
    console.error("Fatal error:", err)
});
