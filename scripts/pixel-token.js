export function getAffectTiles() { return game.settings.get('proper-pixels', 'affectTiles') };
export function getAffectBackgrounds() { return game.settings.get('proper-pixels', 'affectBackgrounds') };
export function getAffectTokens() { return game.settings.get('proper-pixels', 'affectTokens') };
export function getAffectCharacterSheets() { return game.settings.get('proper-pixels', 'affectCharacterSheets') ? window['game'].system.id == 'id' : false};
export function getIgnoreTag() { return game.settings.get('proper-pixels', 'tokenTag') };
export function getShouldIgnorePreTaggerReady(token) {
    const tags = token.document?.flags?.tagger?.tags;
    return game.modules.get('tagger')?.active && tags != null && tags.length > 0 && (tags.find(t => t === getIgnoreTag()) != null);
};


Hooks.once('init', async function () {
    console.log("Loading Proper Pixels");

    game.settings.register('proper-pixels', 'affectTiles', {
        name: "Affects Tiles",
        hint: "If this is toggled, Tiles will be affected by this module",
        scope: "world",
        type: Boolean,
        default: 1,
        config: true,
        requiresReload: true,
        default: true
    });

    game.settings.register('proper-pixels', 'affectBackgrounds', {
        name: "Affects Scene Backgrounds",
        hint: "If this is toggled, Scene Background and Foreground images will be affected by this module",
        scope: "world",
        type: Boolean,
        default: 1,
        config: true,
        requiresReload: true,
        default: true
    });

    game.settings.register('proper-pixels', 'affectTokens', {
        name: "Affects Tokens",
        hint: "If this is toggled, Tokens will be affected by this module",
        scope: "world",
        type: Boolean,
        default: 1,
        config: true,
        requiresReload: true,
        default: true
    });

    if (window['game'].system.id == 'dnd5e') {
        game.settings.register('proper-pixels', 'affectCharacterSheets', {
            name: "Affects Character Sheet",
            hint: "If this is toggled, Character Sheets and side menu Thumbnails will be affected by this module",
            scope: "world",
            type: Boolean,
            default: 1,
            config: true,
            requiresReload: true,
            default: true
        });
    }

    game.settings.register('proper-pixels', 'tokenTag', {
        name: "Ignores Tokens with Tag",
        hint: "(requires Tagger module) If a value is set, tokens with this tag will be ignored",
        scope: "world",
        type: String,
        default: "ignore-pixel",
        config: true,
        requiresReload: true
    });

});

Hooks.on("canvasReady", () => {
    if (getAffectTokens()) {
        for (let token of canvas.tokens.placeables) {
            if (getShouldIgnorePreTaggerReady(token)) {
                continue;
            }
            token.texture.baseTexture.setStyle(0, 0);
            token.texture.baseTexture.update();
        }
    }
    if (getAffectTiles()) {
        // there has to be an easier way to get tiles, right?
        for (let tile of canvas.tiles.placeables) {
            if (getShouldIgnorePreTaggerReady(tile)) {
                continue;
            }
            tile.texture.baseTexture.setStyle(0, 0);
            tile.texture.baseTexture.update();
        }
    }
    if (getAffectBackgrounds()) {
        // the scene background and foreground images live on the primary
        // canvas group, a scene might not have either so check first
        for (let mesh of [canvas.primary.background, canvas.primary.foreground]) {
            const baseTexture = mesh?.texture?.baseTexture;
            if (baseTexture == null) {
                continue;
            }
            baseTexture.setStyle(0, 0);
            baseTexture.update();
        }
    }
})

Hooks.on("createToken", async (token) => {
    // if this await doesn't exist, texture will return undefined
    // if you know a less-hacky way to do this, please feel free to send a PR
    if (getAffectTokens()) {
        if (window.Tagger != null && Tagger.hasTags(token, getIgnoreTag())) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        const baseTexture = token.object.texture.baseTexture;
        baseTexture.setStyle(0, 0);
        baseTexture.update();
    }
})

Hooks.on("preUpdateToken", (token) => {
    if (getAffectTokens()) {
        if (window.Tagger != null && Tagger.hasTags(token, getIgnoreTag())) {
            return;
        }
        const baseTexture = token.object.texture.baseTexture;
        baseTexture.setStyle(0, 0);
    }
})

// preUpdateToken only styles the texture the token had BEFORE the update, so a
// texture swap (directional movement modules, image changes) came in with the
// default smooth filtering and stayed blurry until the scene was reloaded.
// refreshToken fires after every redraw, so restyle the current texture here.
// The scaleMode check keeps this a no-op on the frequent refreshes where the
// texture is already pixelated.
Hooks.on("refreshToken", (token) => {
    if (!getAffectTokens()) {
        return;
    }
    const baseTexture = token.texture?.baseTexture;
    if (baseTexture == null || baseTexture.scaleMode === 0) {
        return;
    }
    if (window.Tagger != null && Tagger.hasTags(token.document, getIgnoreTag())) {
        return;
    }
    baseTexture.setStyle(0, 0);
    baseTexture.update();
})


Hooks.on("createTile", async (tile) => {
    // you know the drill
    if (getAffectTiles()) {
        if (window.Tagger != null && Tagger.hasTags(tile, getIgnoreTag())) {
            return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        const baseTexture = tile.object.texture.baseTexture;
        baseTexture.setStyle(0, 0);
        baseTexture.update();
    }
})

Hooks.on("preUpdateTile", (tile) => {
    if (getAffectTiles()) {
        if (window.Tagger != null && Tagger.hasTags(tile, getIgnoreTag())) {
            return;
        }
        const baseTexture = tile.object.texture.baseTexture;
        baseTexture.setStyle(0, 0);
    }
})

// Same as refreshToken above: restyle tile textures that were swapped in
// after the scene loaded.
Hooks.on("refreshTile", (tile) => {
    if (!getAffectTiles()) {
        return;
    }
    const baseTexture = tile.texture?.baseTexture;
    if (baseTexture == null || baseTexture.scaleMode === 0) {
        return;
    }
    if (window.Tagger != null && Tagger.hasTags(tile.document, getIgnoreTag())) {
        return;
    }
    baseTexture.setStyle(0, 0);
    baseTexture.update();
})

if (window['game'].system.id == 'dnd5e') {
    Hooks.on("renderActorSheet", () => {
        if (getAffectCharacterSheets()) {
            var list = document.getElementsByClassName("portrait")
            for (let item of list)
                item.style.imageRendering = "pixelated"
        }
    })

    Hooks.on("renderSidebarTab", () => {
        if (getAffectCharacterSheets()) {
            var list = document.getElementsByClassName("thumbnail")
            for (let item of list)
                item.style.imageRendering = "pixelated"
        }
    })
}
