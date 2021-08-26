Hooks.on("init", () => {
    if (typeof libWrapper === "undefined") return;
    libWrapper.register("pf2e-pv-binding", "CONFIG.Actor.documentClass.prototype.prepareData", actorPrepareData);
});

Hooks.on("preCreateToken", (token) => {
    const actor = token.actor;
    if (actor && token) {
        const data = getVisionData(actor);
        const updates = getTokenUpdates(token, data);
        if (updates) {
            token.data.update(updates);
        }
    }
})

function actorPrepareData(wrapped, ...args) {
    wrapped(...args);
    if (this.initialized && ["character", "npc", "familiar"].includes(this.type)) {
        const data = getVisionData(this);
        const tokens = canvas.ready ? this.getActiveTokens() : [];
        for (const token of tokens) {
            const updates = getTokenUpdates(token, data);
            if (updates) {
                token.update(updates);
            }
        }
    }
};

function getVisionData(actor) {
    return {
        brightSight: actor.hasDarkvision ? 1000 : 0,
        dimSight: actor.hasLowLightVision ? 1000 : 0,
        isBrightest: actor.items.find(i => i.type === "ancestry")?.slug === "fetchling",
    };
}

function getTokenUpdates(token, { brightSight, dimSight, isBrightest }) {
    const actor = token.actor;

    const updates = {};
    const isAlreadyBrightest = actor.data.flags['perfect-vision']?.brightVisionInDarkness === "bright";
    if (isBrightest && !isAlreadyBrightest) {
        updates["flags.perfect-vision"] = {
            visionRules: "custom",
            dimVisionInDarkness: "bright",
            dimVisionInDimLight: "bright",
            brightVisionInDarkness: "bright",
            brightVisionInDimLight: "bright",
        };
    } else if (!isBrightest && isAlreadyBrightest) {
        updates["flags.perfect-vision"] = { visionRules: "default" };
    }

    if (token.data.brightSight !== brightSight || token.data.dimSight !== dimSight) {
        updates.brightSight = brightSight;
        updates.dimSight = dimSight;
    }

    if (Object.keys(updates).length > 0) {
        return updates;
    }
}
