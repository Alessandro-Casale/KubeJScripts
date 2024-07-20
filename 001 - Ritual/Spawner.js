import { $BlockPos } from "packages/net/minecraft/core/$BlockPos"
import { $BossEvent$BossBarColor } from "packages/net/minecraft/world/$BossEvent$BossBarColor"
import { $BossEvent$BossBarOverlay } from "packages/net/minecraft/world/$BossEvent$BossBarOverlay"
import { $InteractionHand } from "packages/net/minecraft/world/$InteractionHand"
import { $Entity } from "packages/net/minecraft/world/entity/$Entity"
import { $EquipmentSlot } from "packages/net/minecraft/world/entity/$EquipmentSlot"
import { $Heightmap$Types } from "packages/net/minecraft/world/level/levelgen/$Heightmap$Types"

const spawnPositions = [
    { x: 10, z: 0 },
    { x: 9, z: -3 },
    { x: 8, z: -6 },
    { x: 6, z: -8 },
    { x: 3, z: -9 },
    { x: 0, z: -10 },
    { x: -3, z: -9 },
    { x: -6, z: -8 },
    { x: -8, z: -6 },
    { x: -9, z: -3 },
    { x: -10, z: 0 },
    { x: -9, z: 3 },
    { x: -8, z: 6 },
    { x: -6, z: 8 },
    { x: -3, z: 9 },
    { x: 0, z: 10 },
    { x: 3, z: 9 },
    { x: 6, z: 8 },
    { x: 8, z: 6 },
    { x: 9, z: 3 },
]

const persistentTag = 'spawner_mob_event_kills'
const entityTag = 'spawner_mob'
const customBossEventTag = 'kubejs:spawner_mob_event'
const maxKills = 5
/** @type {$BlockContainerJS} */
let clickedBlock
/** @type {$Entity} */
let rewardEntity
let pickedRewardEntity = false

BlockEvents.rightClicked('iron_block', event => {
    const { level, block, entity, item, server, player } = event
    let isCorrectStructure = $PatchouliAPI.getMultiblock('kubejs:spawner').validate(level, block.pos)
    clickedBlock = null

    if (event.hand != $InteractionHand.MAIN_HAND) return
    
    // * PARTICLES TESTS

    if (item === Items.STICK /*&& isCorrectStructure*/) {
        clickedBlock = block
        console.log('Ritual initialization')

        // * Initialize boss bar and player properties
        let bar = server.customBossEvents.create(customBossEventTag, `Kill: 0 / ${maxKills}`)
        bar.addPlayer(player)
        bar.setColor($BossEvent$BossBarColor.GREEN)
        bar.setOverlay($BossEvent$BossBarOverlay.PROGRESS)

        player.persistentData.putInt(persistentTag, 0)

        // * Spawn mobs
        let delay = 10
        for (let i = 0; i < spawnPositions.length; i++) {
            let coordinate = spawnPositions[i]

            server.scheduleInTicks(delay * i, () => {
                spawnSpawnerMobAt(i, block.pos.x + coordinate.x, 30, block.pos.z + coordinate.z)
            })
        }

        // * Spawn reward
        let rewardSpawnPositionX = block.pos.x + 0.5
        let rewardSpawnPositionY = block.pos.y + 10
        let rewardSpawnPositionZ = block.pos.z + 0.5
        spawnReward(rewardSpawnPositionX, rewardSpawnPositionY, rewardSpawnPositionZ)


        // * Spawn lightining bolts
        for (let i = 0; i < 10; i++) {
            // server.tell(i)
            server.scheduleInTicks(5 * i + 100,  () => {
                server.runCommandSilent(`summon minecraft:lightning_bolt ${block.pos.x + randomSign(Math.random() * 3)} ${block.pos.y + 1} ${block.pos.z + randomSign(Math.random() * 3)}`)
            })
        }
    }

    /**
     * Spawn 'spawner_mob' mobs at certain position
     *
     * @param {double} x
     * @param {double} y
     * @param {double} z
     */
    function spawnSpawnerMobAt(index, x, y, z) {

        // * Spawn mob
        let mobEntity = entity.block.createEntity('minecraft:zombie')
        mobEntity.addTag(entityTag)
        mobEntity.addTag(entityTag + String(index))
        mobEntity.x = x + 0.5
        mobEntity.y = y
        mobEntity.z = z + 0.5
        mobEntity.setItemSlot($EquipmentSlot.HEAD, 'stone_button') // Prevent burning
        mobEntity.setItemSlot($EquipmentSlot.CHEST, 'diamond_chestplate')
        mobEntity.setItemSlot($EquipmentSlot.LEGS, 'diamond_leggings')
        mobEntity.setItemSlot($EquipmentSlot.FEET, 'diamond_boots')
        mobEntity.setItemSlot($EquipmentSlot.MAINHAND, Item.of('diamond_sword').enchant('sharpness', 10))
        mobEntity.spawn()
        server.runCommandSilent(`effect give @e[tag=${entityTag}] minecraft:slow_falling infinite 1 true`)

        // * Create column particles
        let spiralParticle2 = new Particle(event)
        spiralParticle2.colorData([123, 230, 224], [100,100,100])
        spiralParticle2.lifetime(50)
        spiralParticle2.motion(0, 0.3, 0)
        spiralParticle2.scaleData(0.25, 0)
        spiralParticle2.transparencyData(1, 0)
        spiralParticle2.type('STAR')

        let height = level.getChunkAt($BlockPos(mobEntity.x, mobEntity.y, mobEntity.z)).getHeight($Heightmap$Types.WORLD_SURFACE_WG, mobEntity.x, mobEntity.z)
        level.setBlockAndUpdate($BlockPos(mobEntity.x - 0.5, height, mobEntity.z - 0.5), Blocks.DIAMOND_BLOCK.getBlockStates()[0])

        spawnColumnParticles(mobEntity, spiralParticle2, mobEntity.x + 0.2, height, mobEntity.z)
        spawnColumnParticles(mobEntity, spiralParticle2, mobEntity.x - 0.2, height, mobEntity.z)
        spawnColumnParticles(mobEntity, spiralParticle2, mobEntity.x, height, mobEntity.z + 0.2)
        spawnColumnParticles(mobEntity, spiralParticle2, mobEntity.x, height, mobEntity.z - 0.2)

        // * Create floating particles
        server.scheduleRepeatingInTicks(1, e => {
            level.spawnParticles('minecraft:poof', true, mobEntity.x, mobEntity.y + 1, mobEntity.z, 0, 0.1, 0, 2, 0)

            if (mobEntity.verticalCollision) {
                // ! delete effect during falling zombies too.
                // ? try adding different and numerated tags
                // server.runCommandSilent('effect clear @e[tag=spawner_mob] minecraft:slow_falling')
                server.runCommandSilent(`kill @e[tag=${entityTag + String(index)}]`)
                e.clear()
            }
        })

        function spawnColumnParticles(entityToCheck, particle, x, y, z) {
            server.scheduleRepeatingInTicks(2.5, e => {
                particle.position(x, y, z)
                particle.spawn(1)

                if (entityToCheck.verticalCollision) {
                    e.clear()
                }
            })
        }
    }

    /**
     * Spawn 'kubejs:final_ritual' reward
     *
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    function spawnReward(x, y, z) {
        let reward = level.createEntity('kubejs:final_ritual')
        reward.x = x
        reward.y = y
        reward.z = z
        reward.spawn()

        rewardEntity = reward

        reward.persistentData.putBoolean('canBePicked', false)
    }
})

EntityEvents.death(event => {
    const { entity, source, server, level } = event

    if (!source.actual?.player) return

    const { player } = source

    if (entity.tags.contains(entityTag)) {
        let amount = player.persistentData.getInt(persistentTag)
        let bar = server.customBossEvents.get(customBossEventTag)

        server.runCommandSilent('kill @e[type=minecraft:item]')

        amount++
        bar.progress += 1 / maxKills
        bar.name = `Kill: ${amount} / ${maxKills}`

        player.persistentData.putInt(persistentTag, amount)
        console.log(`Mobs: ${player.persistentData.getInt(persistentTag)}`)

        // * Create infusion particles
        let pureDistanceX = entity.x - rewardEntity.x
        let pureDistanceY = entity.y - rewardEntity.y
        let pureDistanceZ = entity.z - rewardEntity.z
        let distanceX = Math.abs(entity.x - rewardEntity.x)
        let distanceY = Math.abs(entity.y - rewardEntity.y)
        let distanceZ = Math.abs(entity.z - rewardEntity.z)

        let angleOnFloor = Math.atan2(distanceZ, distanceX)
        let angleOnAir = Math.atan2(distanceY, distanceX)

        let motionX = pureDistanceX <= 0 ? Math.cos(angleOnFloor) : -Math.cos(angleOnFloor)
        let motionY = pureDistanceY <= 0 ? Math.sin(angleOnAir) : -Math.sin(angleOnAir)
        let motionZ = pureDistanceZ <= 0 ? Math.sin(angleOnFloor) : -Math.sin(angleOnFloor)
        let lifetime = (distanceX + distanceY + distanceZ) / (Math.abs(motionX) + Math.abs(motionY) + Math.abs(motionZ))

        let fromToParticles = new Particle(event)
        fromToParticles.colorData([35, 101, 51], [0, 0, 0])
        fromToParticles.lifetime(lifetime)
        fromToParticles.motion(motionX, motionY, motionZ)
        fromToParticles.position(entity.x, entity.y + 0.5, entity.z)
        fromToParticles.scaleData(0.5, 0.5)
        fromToParticles.transparencyData(1, 1)
        fromToParticles.type('STAR')
        let count = 0
        server.scheduleRepeatingInTicks(1, e => {
            fromToParticles.spawn(1)
            count++

            if (count >= 10) {
                e.clear()
            }
        })

        if (amount >= maxKills) {
            bar.removePlayer(player)
            server.runCommandSilent(`kill @e[tag=${entityTag}]`)

            rewardEntity.persistentData.putBoolean('canBePicked', true)

            let rewardParticle = new Particle(event)
            rewardParticle.colorData([255, 255, 0], [255, 0, 0])
            rewardParticle.lifetime(30)
            rewardParticle.position(rewardEntity.x, rewardEntity.y + 0.2, rewardEntity.z)
            rewardParticle.scaleData(0.3, 0)
            rewardParticle.transparencyData(1, 0)
            rewardParticle.type('STAR')
    
            spawnRewardParticles(rewardParticle, 0.9, 0)
            spawnRewardParticles(rewardParticle, 0.9, 0.9)
            spawnRewardParticles(rewardParticle, 0, 0.9)
            spawnRewardParticles(rewardParticle, -0.9, 0.9)
            spawnRewardParticles(rewardParticle, -0.9, 0)
            spawnRewardParticles(rewardParticle, -0.9, -0.9)
            spawnRewardParticles(rewardParticle, 0, -0.9)
            spawnRewardParticles(rewardParticle, 0.9, -0.9)
        }
    }

    function spawnRewardParticles(particle, x, z) {
        let count = 0
        server.scheduleRepeatingInTicks(2.5, e => {
            particle.motion(x, Math.sin(count / 5), z)
            particle.spawn(1)
            count++

            if (pickedRewardEntity) {
                e.clear()
            }
        })
    }
})

/**
 * Return number with or without sign changed (+/-)
 *
 * @param {double} number
 * @returns {double}
 */
function randomSign(number) {
    if (Math.random() <= 0.5) {
        return number
    } else {
        return -number
    }
}

PlayerEvents.tick(event => {
    const { player, level, server } = event

    let bb = player.boundingBox
    let entities = level.getEntitiesWithin(bb)

    if (entities.size() == 0) return

    if (entities[0].type == 'kubejs:final_ritual' && entities[0].persistentData.getBoolean('canBePicked')) {
        server.tell('Picked final ritual item!')
        server.runCommandSilent('kill @e[type=kubejs:final_ritual, limit=1, sort=nearest]')
        player.inventory.insertItem('netherite_ingot', false)

        pickedRewardEntity = true

        return
    }
})

PlayerEvents.loggedOut(event => {
    const { server, player } = event

    server.runCommandSilent('kill @e[type=kubejs:final_ritual, limit=1, sort=nearest]')
})
