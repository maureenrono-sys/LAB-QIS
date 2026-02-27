function requireFields(body, fields) {
    const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length > 0) {
        return `Missing required fields: ${missing.join(', ')}`;
    }
    return null;
}

function isValidMonthPeriod(period) {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
}

function sanitizeInput(value, maxLen = 255) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, maxLen);
}

function sanitizeFreeText(value, maxLen = 4000) {
    if (value === undefined || value === null) return '';
    return String(value)
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
        .replace(/\r\n/g, '\n')
        .trim()
        .slice(0, maxLen);
}

function validateEnum(value, allowedValues, fieldName) {
    if (!allowedValues.includes(value)) {
        return `${fieldName} must be one of: ${allowedValues.join(', ')}`;
    }
    return null;
}

module.exports = {
    requireFields,
    isValidMonthPeriod,
    sanitizeInput,
    sanitizeFreeText,
    validateEnum
};
