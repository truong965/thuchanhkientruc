class EventValidator {
    static validate(payload, requiredFields) {
        const missing = requiredFields.filter(f => payload[f] === undefined || payload[f] === null);
        if (missing.length > 0) {
            throw new Error(`Invalid Event Payload. Missing fields: ${missing.join(', ')}`);
        }
    }
}

class BookingCreatedEvent {
    constructor({ bookingId, userId, userName, movieId, quantity, amount }) {
        this.bookingId = bookingId;
        this.userId = userId;
        this.userName = userName;
        this.movieId = movieId;
        this.quantity = quantity;
        this.amount = amount;
        this.timestamp = new Date().toISOString();
        this.version = '1.1';

        EventValidator.validate(this, ['bookingId', 'userId', 'userName', 'movieId', 'quantity', 'amount']);
    }
}

module.exports = { EventValidator, BookingCreatedEvent };
