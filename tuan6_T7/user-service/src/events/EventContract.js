class EventValidator {
    static validate(payload, requiredFields) {
        const missing = requiredFields.filter(f => payload[f] === undefined || payload[f] === null);
        if (missing.length > 0) {
            throw new Error(`Invalid Event Payload. Missing fields: ${missing.join(', ')}`);
        }
    }
}

class UserRegisteredEvent {
    constructor({ userId, username, name, role }) {
        this.userId = userId;
        this.username = username;
        this.name = name;
        this.role = role || 'USER';
        this.timestamp = new Date().toISOString();
        this.version = '1.0';

        EventValidator.validate(this, ['userId', 'username', 'name', 'role']);
    }
}

module.exports = { EventValidator, UserRegisteredEvent };
