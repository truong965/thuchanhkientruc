export interface IFileSystemNode {
      getName(): string;
      getSize(): number; // Tính bằng KB/MB
      display(indent?: string): void;
}

export class File implements IFileSystemNode {
      constructor(private name: string, private size: number) { }

      public getName(): string {
            return this.name;
      }

      public getSize(): number {
            return this.size;
      }

      public display(indent: string = ""): void {
            console.log(`${indent}- ${this.name} (${this.size}KB)`);
      }
}

export class Directory implements IFileSystemNode {
      private children: IFileSystemNode[] = [];

      constructor(private name: string) { }

      public add(node: IFileSystemNode): void {
            this.children.push(node);
      }

      public remove(node: IFileSystemNode): void {
            this.children = this.children.filter(child => child !== node);
      }

      public getName(): string {
            return this.name;
      }

      // Đệ quy tính tổng dung lượng của thư mục
      public getSize(): number {
            return this.children.reduce((total, child) => total + child.getSize(), 0);
      }

      public display(indent: string = ""): void {
            console.log(`${indent}+ 📁 ${this.name} (${this.getSize()}KB)`);
            for (const child of this.children) {
                  child.display(indent + "  ");
            }
      }
}