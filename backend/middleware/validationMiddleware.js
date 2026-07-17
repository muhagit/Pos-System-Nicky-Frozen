export const validateAuthInput = (req, res, next) => {
    const fieldsToValidate = ["username", "password", "email", "token", "otp"];

    for (const key of fieldsToValidate) {
        if (req.body[key] !== undefined) {
            const val = req.body[key];

            // 1. Check for null
            if (val === null) {
                return res.status(400).json({
                    message: `Invalid request: Field '${key}' cannot be null`,
                });
            }

            // 2. Check type is string
            if (typeof val !== "string") {
                return res.status(400).json({
                    message: `Invalid request: Field '${key}' must be a string`,
                });
            }

            // 3. Check for empty string or whitespace only
            const trimmed = val.trim();
            if (trimmed.length === 0) {
                return res.status(400).json({
                    message: `Invalid request: Field '${key}' cannot be empty or only spaces`,
                });
            }

            // 4. Limit length to prevent buffer/large string payloads
            if (val.length > 5000) {
                return res.status(400).json({
                    message: `Invalid request: Field '${key}' exceeds maximum permitted length`,
                });
            }
        }
    }

    next();
};
