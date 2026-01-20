// ./config/middlewares.js

module.exports = [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      headers: '*',
      // 在这里配置允许的来源
      origin: [
        'http://localhost:3000', // 您本地开发前端的地址
        'http://localhost:5173', // Vite 默认的本地开发地址
        'http://localhost:53781',
        'http://localhost:1337',
        'https://abl.secret-sealing.club', // 您的生产环境前端域名
        'http://www.abl.secret-sealing.club',
        'https://www.abl.secret-sealing.club',
        'https://www.able.secret-sealing.club',
        'https://abl.secret-sealing.club',

        // 如果有其他需要访问的域名，也一并加入
      ],
      
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  {
    name: "strapi::body",
    config: {
      formLimit: "256mb", // modify form body
      jsonLimit: "256mb", // modify JSON body
      textLimit: "256mb", // modify text body
      formidable: {
        maxFileSize: 200 * 1024 * 1024, // multipart data, modify here limit of uploaded file size
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];