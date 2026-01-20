"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/config/server.ts
exports.default = ({ env }) => ({
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    app: {
        keys: env.array('APP_KEYS'),
    },
    // 在 Strapi v4.5+ 版本中，建议将 url 字段放在 admin 对象之外
    // 对于旧版本，您可能需要查阅文档确认
    url: env('URL', 'http://localhost:1337'), // ❗ 使用 'URL' 变量，并设置本地默认值
    webhooks: {
        populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
});
