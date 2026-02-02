exports.authorize = (...roles) => {
    return (req, res, next) => {
        // req.user is populated by the 'protect' middleware
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access Denied: Your role (${req.user.role}) does not have permission for this action.` 
            });
        }
        next();
    };
};