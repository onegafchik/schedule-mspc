import { CommandContext } from "grammy"
import { BotContext } from "./types"
import { mainMenuKeyboard } from "./keyboards"
import { Group, MSPCScheduleService, Schedule } from "../services/mspc"

export async function startCommandHandler(context: CommandContext<BotContext>): Promise<void> {
    context.session.isWaitingForNewGroup = true
    context.session.group = undefined

    await context.reply("Бот запущен 🎉")
    await context.reply("Укажите группу (Пример: 32Н)")
}

export async function changeGroupHandler(context: BotContext): Promise<void> {
    context.session.isWaitingForNewGroup = true

    await context.reply("Укажите группу (Пример: 32Н)")
}

export async function setGroupHandler(context: BotContext): Promise<void> {
    if (context.session.isWaitingForNewGroup) {
        context.session.isWaitingForNewGroup = false
        context.session.group = context.message?.text
    }

    await context.reply(`Группа изменена на ${context.message?.text}`, { reply_markup: mainMenuKeyboard })
}

export async function getScheduleHandler(context: BotContext, indexOfSchedule: number): Promise<void> {
    if (context.session.isWaitingForNewGroup) {
        await context.reply("Укажите группу (Пример: 32Н)")
        return
    }

    if (indexOfSchedule < 0 || indexOfSchedule >= MSPCScheduleService.getSchedules.length) {
        await context.reply("Расписание недоступно", { reply_markup: mainMenuKeyboard })
        return
    }

    const schedule: Schedule | undefined = MSPCScheduleService.getSchedules[indexOfSchedule]

    if (!schedule) {
        await context.reply(`Расписание на ${context.message?.text?.toLowerCase()} недоступно`, {
            reply_markup: mainMenuKeyboard
        })
        return
    }

    const group: Group | undefined = schedule.groups.find((group: Group) => group.name === context.session.group)

    if (!group) {
        await context.reply(`Расписание для ${context.session.group ?? ""} не найдено`, {
            reply_markup: mainMenuKeyboard
        })
        return
    }

    const lessonsBody: string = group.lessonsList
        .filter((row: string) => row.trim() !== "")
        .map((row: string) => row.trimStart())
        .map((row: string) => (/\d/.test(row[0]) ? `\n${row[0] + ")" + row.substring(1)}` : row))
        .reduce((body: string, row: string) => `${body}${row}\n`, "")

    await context.reply(`Расписание на ${schedule.date} (${group.name})\n${lessonsBody}`, {
        reply_markup: mainMenuKeyboard
    })
}
