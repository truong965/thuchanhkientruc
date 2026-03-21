import { IBook } from '../../core/types';

export interface ISearchStrategy {
    search(books: IBook[], query: string): IBook[];
}