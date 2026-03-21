// src/core/types.ts
export type BookType = 'PAPER' | 'EBOOK' | 'AUDIO';
export type Genre = 'FICTION' | 'SCIENCE' | 'HISTORY' | 'TECHNOLOGY';

export interface IBook {
    id: string;
    title: string;
    author: string;
    genre: Genre;
    type: BookType;
    getDetails(): string;
}