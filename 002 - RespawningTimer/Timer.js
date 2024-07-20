const respawningTime = 20 * 5 // 5 seconds
const respawningTimeInSeconds = respawningTime / 20

PlayerEvents.respawned(event => {
    const { server, player, level } = event

    server.gameRules.set('doImmediateRespawn', 'true')
    player.runCommandSilent(`gamemode spectator ${player.username}`)
    player.tell(Component.red('Sei morto!').bold())

    for (let i = 0; i < respawningTimeInSeconds; i++) {
        let calculatedTimeInSeconds = respawningTimeInSeconds - i
        server.scheduleInTicks(i * 20 + 10, () => {
            if (calculatedTimeInSeconds == 1) {
                player.tell(Component.gray(`Rinascerai tra ${calculatedTimeInSeconds} secondo.`))
            } else {
                player.tell(Component.gray(`Rinascerai tra ${calculatedTimeInSeconds} secondi.`))
            }
        })
    }

    server.scheduleInTicks(respawningTime, () => {
        player.runCommandSilent(`gamemode creative ${player.username}`)
        player.tell(Component.green('Sei rinato!').bold())
    })
})
