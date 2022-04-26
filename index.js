const supported = !isNewerVersion(game.version, "9");

Hooks.on("init", () => {
    if (!supported) {
        return;
    }
    
    const rbvEnabled = game.settings.get("pf2e", "automation.rulesBasedVision");
    if (rbvEnabled) {
        Dialog.prompt({
            title: "Not compatible with Rules Based Vision",
            content: "PF2E Perfect Vision Binding is not intended to be used with the <strong><a>Rules Based Vision</a></strong> automation option. Disable this module, or disable RBV.",
            render: ($html) => {
                $html.find("a").on("click", () => {
                    const menu = game.settings.menus.get("pf2e.automation");
                    if (menu) {
                        const app = new menu.type();
                        app.render(true);
                    }
                })
            },
            callback: () => {}
        });
        return;
    }

    if (typeof libWrapper === "undefined") return;
    libWrapper.register("pf2e-pv-binding", "CONFIG.Actor.documentClass.prototype.prepareData", actorPrepareData);

    enableHooks();
});

Hooks.on("ready", () => {
    if (!supported) {
        ui.notifications.error("PF2E Perfect Vision Binding is not compatible and not necessary with Foundry Version 9 and above. Please uninstall.");
    }
});

function enableHooks() {
    Hooks.on("preCreateToken", (token, data) => {
        const actor = token.actor;
        if (actor && token && ["character", "familiar"].includes(actor.type)) {
            const visionData = getVisionData(actor);
            const updates = getTokenUpdates(token, visionData);
            if (updates) {
                mergeObject(data, updates);
                token.data.update(updates);
            }
        }
    });
}

function actorPrepareData(wrapped, ...args) {
    wrapped(...args);
    if (this.initialized && ["character", "familiar"].includes(this.type)) {
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

    if (!isObjectEmpty(updates)) {
        return updates;
    }
}
