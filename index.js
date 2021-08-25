Hooks.on("init", () => {
    if (canvas.sight?.rulesBasedVision) {
        console.warn("PF2e PV Bindings | Rules Based Vision is enabled, so this module is disabled");
        return;
    }

    const TokenClass = TokenDocument;
    const defaultTokenPrepareBaseData = TokenClass.prototype.prepareBaseData;
    TokenClass.prototype.prepareBaseData = function(...args) {
        defaultTokenPrepareBaseData.apply(this, args);
        const actor = this.actor;
        if (["character", "npc", "familiar"].includes(actor?.type)) {
            const newBrightSight = actor.hasDarkvision ? Infinity : 0;
            const newDimSight = actor.hasLowLightVision ? Infinity : 0;
            const isBrightestVision = actor.itemTypes.ancestry[0]?.slug === "fetchling";
            if (isBrightestVision) {
                this.data.update({
                    "flags.perfect-vision": {
                        visionRules: "custom",
                        dimVisionInDarkness: "bright",
                        dimVisionInDimLight: "bright",
                        brightVisionInDarkness: "bright",
                        brightVisionInDimLight: "bright",
                    }
                });
            } else {
                this.data.update({
                    "flags.perfect-vision": {
                        visionRules: "default"
                    }
                });
            }
            
            if (newBrightSight !== this.data.brightSight || newDimSight !== this.data.dimSight) {
                this.data.brightSight = newBrightSight;
                this.data.dimSight = newDimSight;
                if (this.object?.isControlled) {
                    this.object.updateSource();
                }
            }
        }
    }
});
