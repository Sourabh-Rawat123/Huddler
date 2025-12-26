

module.exports.google_Callback = (req, res) => {
    req.flash("success", `Welcome, ${req.user.displayName}!`);
    res.redirect("/listings");
};
