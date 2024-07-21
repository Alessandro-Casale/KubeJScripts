const $Restriction = Java.loadClass('net.darkhax.itemstages.Restriction')
const $RestrictionManager = Java.loadClass('net.darkhax.itemstages.RestrictionManager')

// Create restriction manager
var ITEM_MANAGER = $RestrictionManager

// Add restriction to the manager
// @param requiredStage type Restriction
function apply(restriction) {
    ITEM_MANAGER.INSTANCE.addRestriction(restriction)
}

// Create restriction, then add it to the manager
// @param requiredStage type String
function createRestrictionItem(requiredStage) {
    let restriction = new $Restriction(String(requiredStage))
    apply(restriction)
    return restriction
}

// @param condition type Predicate<ItemStack>
// @param requiredStage type String
function addPredicateStage(condition, requiredStage) {
    return createRestrictionItem(requiredStage).restrict(condition)
}

// @param ingredient type String
// @param requiredStage type String
function addItemStage(ingredient, requiredStage) {
    return createRestrictionItem(requiredStage).restrict(Ingredient.of(ingredient))
}

// @param ingredient type String
// @param requiredStage type String
function addTagStage(tag, requiredStage) {
    let items = Ingredient.of(tag).itemIds

    if (!items.isEmpty()) {
        items.forEach(item => {
            addItemStage(item, requiredStage)
        })
    } else {
        console.log(`[GameStages Integration] Tag: ${tag} is empty!`)
    }
}

// @param ingredient type String
// @param requiredStage type String
function addModStage(modid, requiredStage) {
    let items = Ingredient.of(`@${modid}`).itemIds

    if (!items.isEmpty()) {
        items.forEach(item => {
            addItemStage(item, requiredStage)
        })
    } else {
        console.log(`[GameStages Integration] Mod: ${modid} is empty!`)
    }
}
