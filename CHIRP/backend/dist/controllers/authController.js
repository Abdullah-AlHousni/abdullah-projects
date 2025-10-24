"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = exports.signup = void 0;
const authService_1 = require("../services/authService");
const signup = async (req, res) => {
    try {
        const result = await (0, authService_1.registerUser)(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        const status = error.status ?? 500;
        console.error("Signup error", error);
        res.status(status).json({ message: error.message });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    try {
        const result = await (0, authService_1.loginUser)(req.body);
        res.json(result);
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await (0, authService_1.getCurrentUser)(req.user.id);
        res.json({ user });
    }
    catch (error) {
        const status = error.status ?? 500;
        res.status(status).json({ message: error.message });
    }
};
exports.me = me;
