/**
 * Module dependencies.
 */
const path = require('path');
const express = require('express');
const compression = require('compression');
const session = require('express-session');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const flash = require('express-flash');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const expressJWT = require('express-jwt')
const fs = require('fs')

/**
 * Create Express server.
 */
const app = express();
console.log('Run this app using "npm start" to include sass/scss/css builds.\n');


/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
dotenv.config({ path: '.env.example' });

/**
 * Set config values
 */
const secureTransfer = process.env.BASE_URL.startsWith('https');

/**
 * Rate limiting configuration
 * This is a basic rate limiting configuration. You may want to adjust the settings
 * based on your application's needs and the expected traffic patterns.
 * Also, consider adding a proxy such as cloudflare for production.
 */
// Global Rate Limiter Config
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Strict Auth Rate Limiter Config for signup, password recover, account verification, login by email
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});

// Login Rate Limiter Config
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
});

// This logic for numberOfProxies works for local testing, ngrok use, single host deployments
// behind cloudflare, etc. You may need to change it for more complex network settings.
// See readme.md for more info.
let numberOfProxies;
if (secureTransfer) numberOfProxies = 1;
else numberOfProxies = 0;

/**
 * Controllers (route handlers).
 */
const apiController = require('./controllers/api');


/**
 * Request logging configuration
 */
const { morganLogger } = require('./config/morgan');

/**
 * Connect to MongoDB.
 */
// mongoose.connect(process.env.MONGODB_URI);
// mongoose.connection.on('error', (err) => {
//   console.error(err);
//   console.log('MongoDB connection error. Please make sure MongoDB is running.');
//   process.exit(1);
// });

/**
 * Express configuration.
 */
app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', numberOfProxies);
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use(
  session({
    resave: true, // Only save session if modified
    saveUninitialized: false, // Do not save sessions until we have something to store
    secret: process.env.SESSION_SECRET,
    name: 'startercookie', // change the cookie name for additional security in production
    cookie: {
      maxAge: 1209600000, // Two weeks in milliseconds
      secure: secureTransfer,
    },
    // store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  }),
);
// app.use(expressJWT({
//   secret: 'Josiah',  // 解析口令, 需要和加密的时候一致
//   algorithms: ['HS256']   // 加密方式: SHA256 加密方式在 express-jwt 里面叫做 HS256
// }).unless({ 
//   path: ['/login', '/register'],
//   methods: ['GET', 'POST']
// }))
app.use(morganLogger());
app.use(flash());
app.use((req, res, next) => {
  if (req.path === '/api/upload' || req.path === '/api/togetherai-camera') {
    // Multer multipart/form-data handling needs to occur before the Lusca CSRF check.
    // WARN: Any path that is not protected by CSRF here should have lusca.csrf() chained
    // in their route handler.
    next();
  } else {
    lusca.csrf()(req, res, next);
  }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});
// Function to validate if the URL is a safe relative path
const isSafeRedirect = (url) => /^\/[a-zA-Z0-9/_-]*$/.test(url);
app.use((req, res, next) => {
  // After successful login, redirect back to the intended page
  if (!req.user && req.path !== '/login' && req.path !== '/signup' && !req.path.match(/^\/auth/) && !req.path.match(/\./)) {
    const returnTo = req.originalUrl;
    if (isSafeRedirect(returnTo)) {
      req.session.returnTo = returnTo;
    } else {
      req.session.returnTo = '/';
    }
  } else if (req.user && (req.path === '/account' || req.path.match(/^\/api/))) {
    const returnTo = req.originalUrl;
    if (isSafeRedirect(returnTo)) {
      req.session.returnTo = returnTo;
    } else {
      req.session.returnTo = '/';
    }
  }
  next();
});
app.use('/', express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));


/**
 * Analytics IDs needed thru layout.pug; set as express local so we don't have to pass them with each render call
 */
app.locals.FACEBOOK_ID = process.env.FACEBOOK_ID ? process.env.FACEBOOK_ID : null;
app.locals.GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID ? process.env.GOOGLE_ANALYTICS_ID : null;
app.locals.FACEBOOK_PIXEL_ID = process.env.FACEBOOK_PIXEL_ID ? process.env.FACEBOOK_PIXEL_ID : null;

/**
 * Primary app routes.
 */
app.get('/test',lusca({ csrf: true }), (req,res) => {
  const filePath = path.join(__dirname, 'a.js');
  const readStream = fs.createReadStream(filePath);
  
  // 设置响应头触发下载

res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  
  readStream.pipe(res); // 管道传输到响应流
}
);
// app.get('/', homeController.index);
// app.get('/login', userController.getLogin);
// app.get('/login/verify/:token', loginLimiter, userController.getLoginByEmail);
// app.get('/logout', userController.logout);
// app.get('/forgot', userController.getForgot);
// app.get('/reset/:token', userController.getReset);
// app.get('/signup', userController.getSignup);
// app.get('/contact', strictLimiter, contactController.getContact);

/**
 * API examples routes.
 */
app.get('/api/upload', lusca({ csrf: true }), apiController.getFileUpload);
app.post('/api/upload', strictLimiter, apiController.uploadMiddleware, lusca({ csrf: true }), apiController.postFileUpload);

// if (process.env.NODE_ENV === 'development') {
//   // only use in development
//   app.use(errorHandler());
// }



/**
 * Error Handler.
 */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('服务器出错')
});



/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
  const { BASE_URL } = process.env;
  const colonIndex = BASE_URL.lastIndexOf(':');
  const port = parseInt(BASE_URL.slice(colonIndex + 1), 10);

  if (!BASE_URL.startsWith('http://localhost')) {
    console.log(
      `The BASE_URL env variable is set to ${BASE_URL}. If you directly test the application through http://localhost:${app.get('port')} instead of the BASE_URL, it may cause a CSRF mismatch or an Oauth authentication failure. To avoid the issues, change the BASE_URL or configure your proxy to match it.\n`,
    );
  } else if (app.get('port') !== port) {
    console.warn(`WARNING: The BASE_URL environment variable and the App have a port mismatch. If you plan to view the app in your browser using the localhost address, you may need to adjust one of the ports to make them match. BASE_URL: ${BASE_URL}\n`);
  }

  console.log(`App is running on http://localhost:${app.get('port')} in ${app.get('env')} mode.`);
  console.log('Press CTRL-C to stop.');
});

module.exports = app;
