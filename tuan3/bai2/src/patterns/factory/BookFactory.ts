export class BookFactory {
    public static createBook(type: BookType, id: string, title: string, author: string, genre: Genre): IBook {
        switch (type) {
            case 'PAPER': return new PaperBook(id, title, author, genre);
            case 'EBOOK': return new EBook(id, title, author, genre);
            default: throw new Error(`Book type ${type} is not supported.`);
        }
    }
}