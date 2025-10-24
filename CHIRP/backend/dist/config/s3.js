"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const env_1 = __importDefault(require("./env"));
exports.s3Client = new client_s3_1.S3Client({
    region: env_1.default.AWS_REGION,
    credentials: {
        accessKeyId: env_1.default.AWS_ACCESS_KEY_ID,
        secretAccessKey: env_1.default.AWS_SECRET_ACCESS_KEY,
    },
});
exports.default = exports.s3Client;
