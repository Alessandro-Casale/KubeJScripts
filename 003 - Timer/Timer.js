import { $MinecraftServer } from "packages/net/minecraft/server/$MinecraftServer"
import { $ObjectiveCriteria } from "packages/net/minecraft/world/scores/criteria/$ObjectiveCriteria"

let stopped = true
let timerEnabled = false

ServerEvents.commandRegistry(event => {
    const { commands: Commands, arguments: Arguments } = event

    event.register(
        Commands.literal('timer')
        .then(Commands.literal('set')
            .then(Commands.argument('minutes', Arguments.STRING.create(event))
                .then(Commands.argument('seconds', Arguments.STRING.create(event))
                    .executes(ctx => {
                        /** @type {string} */
                        const arg1 = Arguments.STRING.getResult(ctx, 'minutes')
                        /** @type {string} */
                        const arg2 = Arguments.STRING.getResult(ctx, 'seconds')
                        const { source } = ctx
                        /** @type {$MinecraftServer} */
                        const server = source.player.level.server

                        stopped = true

                        server.runCommandSilent(`scoreboard players set 1 Tick 0`)
                        server.runCommandSilent(`scoreboard players set 1 Second ${arg2.charCodeAt(1)}`)
                        server.runCommandSilent(`scoreboard players set 0 Second ${arg2.charCodeAt(0)}`)
                        server.runCommandSilent(`scoreboard players set 1 Minute ${arg1.charCodeAt(1)}`)
                        server.runCommandSilent(`scoreboard players set 0 Minute ${arg1.charCodeAt(0)}`)

                        return 1
                    })
                )
            )
        )
    )

    event.register(
        Commands.literal('timer')
        .then(Commands.literal('start')
            .executes(ctx => {
                stopped = false

                const { source } = ctx
                /** @type {$MinecraftServer} */
                const server = source.player.level.server

                server.runCommandSilent('title @a title {"text":"Via!", "color":"aqua"}')

                return 1
            })
        )
    )

    event.register(
        Commands.literal('timer')
        .then(Commands.literal('stop')
            .executes(() => {
                stopped = true

                return 1
            })
        )
    )

    event.register(
        Commands.literal('timer')
        .then(Commands.literal('enable')
            .executes(ctx => {
                timerEnabled = true

                const { source } = ctx
                /** @type {$MinecraftServer} */
                const server = source.player.level.server

                server.persistentData.putBoolean('timerEnabled', true)

                return 1
            })
        )
    )

    event.register(
        Commands.literal('timer')
        .then(Commands.literal('disable')
            .executes(ctx => {
                timerEnabled = false

                const { source } = ctx
                /** @type {$MinecraftServer} */
                const server = source.player.level.server

                server.persistentData.putBoolean('timerEnabled', false)

                return 1
            })
        )
    )
})

ServerEvents.loaded(event => {
    const { server } = event

    timerEnabled = server.persistentData.getBoolean('timerEnabled')

    if (!server.persistentData.getBoolean('alreadyLoggedIn')) {
        server.scoreboard.addObjective('Minute', $ObjectiveCriteria.DUMMY, 'Minute', 'integer')
        server.scoreboard.addObjective('Second', $ObjectiveCriteria.DUMMY, 'Second', 'integer')
        server.scoreboard.addObjective('Tick', $ObjectiveCriteria.DUMMY, 'Tick', 'integer')

        server.tell('Scoreboard Created!')

        server.persistentData.putBoolean('alreadyLoggedIn', true)
    }
})

ServerEvents.tick(event => {
    const { server } = event

    if (!timerEnabled) { return }

    server.runCommandSilent('title @a actionbar ["",{"score":{"name":"0","objective":"Minute"},"color":"dark_green"},{"score":{"name":"1","objective":"Minute"},"color":"dark_green"},{"text":":","bold":true,"color":"dark_green"},{"score":{"name":"0","objective":"Second"},"color":"dark_green"},{"score":{"name":"1","objective":"Second"},"color":"dark_green"},{"text":":","bold":true,"color":"dark_green"},{"score":{"name":"1","objective":"Tick"},"color":"dark_green"}]')

    if (stopped) { return }

    server.runCommandSilent('scoreboard players add 1 Tick 1')
    let tickScore = getScore('1', 'Tick')

    let onePositionSecond = getScore('1', 'Second')
    let zeroPositionSecond = getScore('0', 'Second')
    let onePositionMinute = getScore('1', 'Minute')

    if (tickScore >= 20 && !stopped) {
        server.runCommandSilent('scoreboard players set 1 Tick 0')
        server.runCommandSilent('scoreboard players remove 1 Second 1')

        onePositionSecond = getScore('1', 'Second')
        if (onePositionSecond == -1) {
            server.runCommandSilent('scoreboard players set 1 Second 9')
            server.runCommandSilent('scoreboard players remove 0 Second 1')

            zeroPositionSecond = getScore('0', 'Second')
            if (zeroPositionSecond == -1) {
                server.runCommandSilent('scoreboard players set 0 Second 5')
                server.runCommandSilent('scoreboard players remove 1 Minute 1')

                onePositionMinute = getScore('1', 'Minute')
                if (onePositionMinute == -1) {
                    server.runCommandSilent('scoreboard players set 1 Minute 9')
                    server.runCommandSilent('scoreboard players remove 0 Minute 1')
                }
            }
        }
    }

    let zeroPositionMinute = getScore('0', 'Minute')
    if ((zeroPositionMinute == 0) && 
        (onePositionMinute == 0) && 
        (zeroPositionSecond == 0) && 
        (onePositionSecond == 0)) {

        server.runCommandSilent('title @a title {"text":"Tempo Scaduto!", "color":"red"}')
        
        stopped = true
    }

    /**
     * Get score from scoreboard
     *
     * @param {string} player
     * @param {string} objective
     * @return {integer} 
     */
    function getScore(player, objective) {
        return server.scoreboard.getPlayerScores(String(player)).get(server.scoreboard.getObjective(String(objective))).getScore()
    }
})
