"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryGetViewerId = void 0;
const jwt_1 = require("./jwt");
const tryGetViewerId = (authorization) => {
    if (!authorization) {
        return undefined;
    }
    const tokenHeader = Array.isArray(authorization) ? authorization[0] : authorization;
    if (!tokenHeader?.startsWith("Bearer ")) {
        return undefined;
    }
    const token = tokenHeader.split(" ")[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        return decoded.userId;
    }
    catch (error) {
        console.warn("Unable to parse viewer token", error);
        return undefined;
    }
};
exports.tryGetViewerId = tryGetViewerId;
exports.default = exports.tryGetViewerId;
