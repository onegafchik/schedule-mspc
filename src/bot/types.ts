import { Context, SessionFlavor } from "grammy"

export type BotContext = Context & SessionFlavor<GroupData>

export interface GroupData {
    isWaitingForNewGroup: boolean
    group?: string
}
