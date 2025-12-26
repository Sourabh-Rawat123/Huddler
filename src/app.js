const express = require("express");
const app = express();
const cors = require("cors");
const ApiError = require("./Utils/Api_Error.js");
const path = require("path");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const session = require("express-session");
const passport = require("passport");
const flash=require("connect-flash");
let methodOverride = require('method-override');
// Initialize Passport configuration
require("./config/passport");

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static(path.join(__dirname, "../public")));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(cors());
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));
// Session middleware (required for Passport)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    next();
})
// Import routes
const userRoutes = require("./Routes/User.Routes.js");
const chatRoutes = require("./Routes/Chat.Routes.js");
// Mount routes
app.use("/user", userRoutes);
app.use("/chat",chatRoutes);
app.get("/", (req, res) => {
    res.redirect("/user/login");
})

app.use((req, res, next) => {

    next(new ApiError(404, `Route ${req.url} not found`));
});
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Something went wrong!";

    console.error("❌ Error:", err);

    // Otherwise render error page
    res.status(statusCode).render("Error/error.ejs", {
        statusCode,
        message,
        error: err
    });
});
module.exports = app;