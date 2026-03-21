export abstract class BorrowDecorator implements IBorrowRecord {
    constructor(protected record: IBorrowRecord) {}
    
    get book(): IBook { return this.record.book; }
    getDueDate(): Date { return this.record.getDueDate(); }
    getDescription(): string { return this.record.getDescription(); }
    getFee(): number { return this.record.getFee(); }
}

export class ExtendedTimeDecorator extends BorrowDecorator {
    getDueDate(): Date {
        const baseDate = super.getDueDate();
        baseDate.setDate(baseDate.getDate() + 7); // Gia hạn thêm 7 ngày
        return baseDate;
    }
    
    getDescription(): string { return super.getDescription() + " (Đã gia hạn)"; }
    getFee(): number { return super.getFee() + 10000; } // Phí gia hạn
}

export class BrailleEditionDecorator extends BorrowDecorator {
    getDescription(): string { return super.getDescription() + " [Phiên bản chữ nổi Braille]"; }
    // Không tính thêm phí cho bản Braille
}