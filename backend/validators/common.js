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

module.exports = {
    requireFields,
    isValidMonthPeriod
};
