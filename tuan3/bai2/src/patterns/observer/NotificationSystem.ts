export enum EventType {
    NEW_BOOK_ADDED = 'NEW_BOOK_ADDED',
    BOOK_OVERDUE = 'BOOK_OVERDUE'
}

export interface IObserver {
    update(eventType: EventType, payload: any): void;
}

export class UserNotifier implements IObserver {
    constructor(private username: string) {}
    
    update(eventType: EventType, payload: any): void {
        if (eventType === EventType.NEW_BOOK_ADDED) {
            console.log(`[To: ${this.username}] Sách mới đã có tại thư viện: ${payload.title}`);
        }
    }
}

export class StaffNotifier implements IObserver {
    update(eventType: EventType, payload: any): void {
        if (eventType === EventType.BOOK_OVERDUE) {
            console.log(`[Staff Alert] Sách quá hạn: ID ${payload.bookId} mượn bởi ${payload.userId}`);
        }
    }
}