class EventValidator {
    static validate(payload, requiredFields) {
        const missing = requiredFields.filter(f => payload[f] === undefined || payload[f] === null);
        if (missing.length > 0) {
            throw new Error(`Invalid Event Payload. Missing fields: ${missing.join(', ')}`);
        }
    }
}

class PaymentCompletedEvent {
    constructor({ bookingId, userName, amount, movieId, quantity }) {
        this.bookingId = bookingId;
        this.userName = userName;
        this.amount = amount;
        this.movieId = movieId;
        this.quantity = quantity;
        this.timestamp = new Date().toISOString();
        this.version = '1.1';

        EventValidator.validate(this, ['bookingId', 'userName', 'amount', 'movieId', 'quantity']);
    }
}

class BookingFailedEvent {
    constructor({ bookingId, userName, reason }) {
        this.bookingId = bookingId;
        this.userName = userName;
        this.reason = reason || 'Payment Failed';
        this.timestamp = new Date().toISOString();
        this.version = '1.0';

        EventValidator.validate(this, ['bookingId', 'userName', 'reason']);
    }
}

module.exports = { EventValidator, PaymentCompletedEvent, BookingFailedEvent };
