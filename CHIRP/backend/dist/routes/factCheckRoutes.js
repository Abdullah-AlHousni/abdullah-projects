"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const factCheckController_1 = require("../controllers/factCheckController");
const router = (0, express_1.Router)();
router.post("/:chirpId", factCheckController_1.triggerFactCheck);
router.get("/:chirpId", factCheckController_1.fetchFactCheck);
exports.default = router;
