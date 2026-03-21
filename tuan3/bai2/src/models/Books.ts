// src/models/Books.ts
import { IBook, BookType, Genre } from '../core/types';

export class PaperBook implements IBook {
    constructor(
        public id: string, public title: string, 
        public author: string, public genre: Genre, 
        public type: BookType = 'PAPER'
    ) {}
    getDetails(): string { return `[Paper] ${this.title} by ${this.author}`; }
}

export class EBook implements IBook {
    constructor(
        public id: string, public title: string, 
        public author: string, public genre: Genre, 
        public type: BookType = 'EBOOK'
    ) {}
    getDetails(): string { return `[EBook] ${this.title} by ${this.author} (Downloadable)`; }
}
