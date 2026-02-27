const { requireFields, validateEnum } = require('./common');

const CLIENT_TYPES = ['Patient', 'Clinician', 'Corporate Client', 'Internal Staff'];
const CATEGORIES = ['Complaint', 'Suggestion', 'Compliment', 'Inquiry'];
const SEVERITY = ['Low', 'Medium', 'High', 'Critical'];
const STATUSES = ['New', 'Under Review', 'Investigation Ongoing', 'Action Implemented', 'Closed'];
const TAGS = ['TAT delay', 'Staff attitude', 'Result accuracy', 'Sample rejection', 'Billing', 'Communication', 'Other'];

function validateClientFeedback(payload) {
    const missingError = requireFields(payload, [
        'clientType',
        'department',
        'category',
        'description',
        'satisfactionRating'
    ]);
    if (missingError) return missingError;

    const rating = Number(payload.satisfactionRating);
    if (Number.isNaN(rating) || rating < 1 || rating > 5) {
        return 'satisfactionRating must be between 1 and 5';
    }

    const clientTypeError = validateEnum(payload.clientType, CLIENT_TYPES, 'clientType');
    if (clientTypeError) return clientTypeError;

    const categoryError = validateEnum(payload.category, CATEGORIES, 'category');
    if (categoryError) return categoryError;

    if (payload.severity !== undefined) {
        const severityError = validateEnum(payload.severity, SEVERITY, 'severity');
        if (severityError) return severityError;
    }

    if (payload.status !== undefined) {
        const statusError = validateEnum(payload.status, STATUSES, 'status');
        if (statusError) return statusError;
    }

    if (payload.tags !== undefined) {
        if (!Array.isArray(payload.tags)) return 'tags must be an array';
        const unknown = payload.tags.filter((tag) => !TAGS.includes(tag));
        if (unknown.length) return `Unsupported tags: ${unknown.join(', ')}`;
    }

    if (payload.dueDate) {
        const d = new Date(payload.dueDate);
        if (Number.isNaN(d.getTime())) return 'dueDate must be a valid date';
    }
    return null;
}

module.exports = {
    validateClientFeedback,
    FEEDBACK_ENUMS: {
        CLIENT_TYPES,
        CATEGORIES,
        SEVERITY,
        STATUSES,
        TAGS
    }
};
