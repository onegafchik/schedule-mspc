export type ScheduleTuple = [Schedule?, Schedule?, Schedule?]

export interface Group {
    name: string
    lessonsList: Array<string>
}

export interface Schedule {
    readonly date: string
    readonly groups: Array<Group>
}
