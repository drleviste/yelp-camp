var express         = require("express"),
    app             = express(),
    request         = require("request"),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    Campground      = require("./models/campground"),
    Comment         = require("./models/comment"),
    User            = require("./models/user"),
    seedDB          = require("./seeds");


mongoose.connect("mongodb://localhost:27017/yelp_camp_v6", {useNewUrlParser: true});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
// seedDB();

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Pass",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.currentUser = req.user;
    next();
});

app.get("/", function(req,res){
    res.render("landing");
});

// INDEX - show all campgrounds
app.get("/campgrounds", function(req,res){
    // console.log(req.user);
    // get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        } else{
            res.render("campgrounds/index", {campgrounds: allCampgrounds});
        }
    });
});

app.get("/campgrounds/new", function(req, res){
    res.render("campgrounds/new");
});

// Show campground
app.get("/campgrounds/:id", function(req, res){
    // find campground with ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            console.log(foundCampground);
            // render show template
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});


app.post("/campgrounds", function(req, res){
    // res.send("POST ROUTE");
    var name = req.body.name;
    var image = req.body.image;
    var desc = req.body.description;
    var newCampground = {name: name, image: image, description: desc};
    // Create new campground and save to db
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            // redirect is GET
            res.redirect("/campgrounds");
        }
    });

});

// ================
// COMMENTS ROUTES
// ================

app.get("/campgrounds/:id/comments/new", isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else{
            res.render("comments/new", {campground: campground});

        }
    });
});

app.post("/campgrounds/:id/comments", isLoggedIn, function(req, res){
    // lookup campground using ID
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        } else{
        // create new comment
        Comment.create(req.body.comment, function(err, comment){
            if(err){
                console.log(err);
            } else{
                campground.comments.push(comment);
                campground.save();
                res.redirect("/campgrounds/" + campground._id);
            }
        });
        // connect new comment to campground
        // redirect to show page

        }
    });
});

// =============
// AUTH ROUTES
// =============

//show reg form
app.get("/register", (req,res) => {
    res.render("register");
});
// sign up logic
app.post("/register", (req,res) => {
    // res.send("Signing you up!");
    var newUser = new User({username: req.body.username})
    User.register(newUser, req.body.password, (err,user) => {
        if(err){
            console.log(err);
            return res.render("register")
        }
        //local strategy
        passport.authenticate("local")(req,res, () => {
            res.redirect("/campgrounds");
        });
    });
});

//show login form
app.get("/login", (req,res) => {
    res.render("login");
});
// handling login logic
// format: app.post("/login", middleware, callback)
// use passport middleware to login
app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/campgrounds",
        failureRedirect: "/login"
    }), (req,res) => {
});
//logout route
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/campgrounds");
});


//middleware
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

app.listen(3000, function(){
    console.log("YELP CAMP Server started at PORT 3000");
});
