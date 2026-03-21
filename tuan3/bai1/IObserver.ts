// src/core/IObserver.ts
export interface IObserver<T> {
    update(context: T): void;
}

export interface ISubject<T> {
    attach(observer: IObserver<T>): void;
    detach(observer: IObserver<T>): void;
    notify(): void;
}

// src/patterns/observer/TaskSubject.ts
export interface TaskData {
    taskId: string;
    title: string;
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
}

export class TaskSubject implements ISubject<TaskData> {
    // Sử dụng Set để tránh duplicate observer
    private observers: Set<IObserver<TaskData>> = new Set();
    private taskData: TaskData;

    constructor(initialData: TaskData) {
        this.taskData = initialData;
    }

    public attach(observer: IObserver<TaskData>): void {
        this.observers.add(observer);
    }

    public detach(observer: IObserver<TaskData>): void {
        this.observers.delete(observer);
    }

    public notify(): void {
        for (const observer of this.observers) {
            observer.update(this.taskData);
        }
    }

    public changeStatus(newStatus: TaskData['status']): void {
        if (this.taskData.status !== newStatus) {
            this.taskData.status = newStatus;
            this.notify();
        }
    }
}

// src/patterns/observer/TeamMemberObserver.ts
export class TeamMemberObserver implements IObserver<TaskData> {
    constructor(private memberName: string) {}

    public update(data: TaskData): void {
        console.log(`[Notification to ${this.memberName}]: Task '${data.title}' has changed status to ${data.status}.`);
    }
}