export class SearchByTitle implements ISearchStrategy {
    search(books: IBook[], query: string): IBook[] {
        return books.filter(b => b.title.toLowerCase().includes(query.toLowerCase()));
    }
}

export class SearchByAuthor implements ISearchStrategy {
    search(books: IBook[], query: string): IBook[] {
        return books.filter(b => b.author.toLowerCase().includes(query.toLowerCase()));
    }
}