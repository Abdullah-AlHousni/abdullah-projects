"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = __importDefault(require("../config/env"));
const signToken = (userId) => jsonwebtoken_1.default.sign({ userId }, env_1.default.JWT_SECRET, { expiresIn: "7d" });
exports.signToken = signToken;
const verifyToken = (token) => jsonwebtoken_1.default.verify(token, env_1.default.JWT_SECRET);
exports.verifyToken = verifyToken;
exports.default = {
    signToken: exports.signToken,
    verifyToken: exports.verifyToken,
};
