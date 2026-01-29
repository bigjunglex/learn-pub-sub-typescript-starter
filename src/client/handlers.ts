import type { Channel, ConfirmChannel } from "amqplib";
import type { ArmyMove, RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { Acktype, publishJSON } from "../internal/pubsub/pubsub.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";

export function handlerPause(gs: GameState): (ps:PlayingState) => Acktype {
    return function (ps: PlayingState) {
        handlePause(gs, ps);
        console.log('> ');
        return Acktype.Ack
    }
}

export function handlerMove(gs: GameState, channel: ConfirmChannel): (move: ArmyMove) => Promise<Acktype> {
    return async function (move) {
        const o = handleMove(gs, move);
        console.log(move)
        console.log('> ');
        if (o === MoveOutcome.MakeWar) {
            const player = gs.getPlayerSnap();
            const payload: RecognitionOfWar = {
                attacker: move.player,
                defender: player
            }
           try {
               await publishJSON(
                   channel,
                   ExchangePerilTopic,
                   `${WarRecognitionsPrefix}.${player.username}`,
                   payload
                );
                return Acktype.Ack
            } catch (err) {
                console.log(err)
                return Acktype.NackRequeue
            }
        } else if ( o === MoveOutcome.Safe) {
            return Acktype.Ack
        } else {
            return Acktype.NackDiscard
        }
    }
}


export function handlerWar(gs: GameState): (
    rw: RecognitionOfWar
) => Promise<Acktype> {
    return async function(rw: RecognitionOfWar) {
        console.log('> ')
        const { result } = handleWar(gs, rw);
        switch (result) {
            case WarOutcome.NotInvolved: return Acktype.NackRequeue;
            case WarOutcome.NoUnits: return Acktype.NackDiscard;
            case WarOutcome.OpponentWon: return Acktype.Ack;
            case WarOutcome.Draw: return Acktype.Ack;
            case WarOutcome.YouWon: return Acktype.Ack;
            default: {
                console.error('Undefined War outcome');
                return Acktype.NackDiscard;
            }                
        }

    }
}