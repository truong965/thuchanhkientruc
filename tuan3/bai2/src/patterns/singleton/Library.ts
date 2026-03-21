import { IBook, BookType, Genre } from '../../core/types';
import { BookFactory } from '../factory/BookFactory';
import { ISearchStrategy } from '../strategy/ISearchStrategy';
import { IObserver, EventType } from '../observer/NotificationSystem';

export class Library {
    private static instance: Library;
    private books: IBook[] = [];
    private observers: IObserver[] = [];
    private searchStrategy!: ISearchStrategy; // Thuật toán tìm kiếm hiện tại

    private constructor() {
        // Private constructor ngăn chặn việc dùng từ khóa 'new' từ bên ngoài
    }

    public static getInstance(): Library {
        if (!Library.instance) {
            Library.instance = new Library();
        }
        return Library.instance;
    }

    // --- Quản lý Observer ---
    public subscribe(observer: IObserver): void {
        this.observers.push(observer);
    }

    private notifyObservers(eventType: EventType, payload: any): void {
        for (const obs of this.observers) {
            obs.update(eventType, payload);
        }
    }

    // --- Core Business Logic ---
    public addBook(type: BookType, id: string, title: string, author: string, genre: Genre): void {
        const newBook = BookFactory.createBook(type, id, title, author, genre);
        this.books.push(newBook);
        
        // Trigger Observer Pattern
        this.notifyObservers(EventType.NEW_BOOK_ADDED, newBook);
    }

    // --- Strategy Integration ---
    public setSearchStrategy(strategy: ISearchStrategy): void {
        this.searchStrategy = strategy;
    }

    public searchBooks(query: string): IBook[] {
        if (!this.searchStrategy) {
            throw new Error("Search strategy must be set before searching.");
        }
        return this.searchStrategy.search(this.books, query);
    }
    
    public getAllBooks(): IBook[] {
        return this.books;
    }
}