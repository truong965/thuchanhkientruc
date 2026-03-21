import { IBook } from '../../core/types';

export interface IBorrowRecord {
    book: IBook;
    getDueDate(): Date;
    getDescription(): string;
    getFee(): number;
}

export class BaseBorrowRecord implements IBorrowRecord {
    constructor(public book: IBook, private borrowDate: Date = new Date()) {}

    getDueDate(): Date {
        const dueDate = new Date(this.borrowDate);
        dueDate.setDate(dueDate.getDate() + 14); // Mặc định mượn 14 ngày
        return dueDate;
    }
    
    getDescription(): string { return `Mượn sách: ${this.book.title}`; }
    getFee(): number { return 0; } // Mượn cơ bản miễn phí
}
