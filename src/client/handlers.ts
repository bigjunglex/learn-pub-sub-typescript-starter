import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { Acktype } from "../internal/pubsub/pubsub.js";

export function handlerPause(gs: GameState): (ps:PlayingState) => Acktype {
    return function (ps: PlayingState) {
        handlePause(gs, ps);
        console.log('> ');
        return Acktype.Ack
    }
}

export function handlerMove(gs: GameState): (move: ArmyMove) => Acktype {
    return function (move) {
        const o = handleMove(gs, move);
        console.log('> ');
        if (o === MoveOutcome.MakeWar || o === MoveOutcome.Safe) {
            return Acktype.Ack
        } else {
            return Acktype.NackDiscard
        }
    }
}
