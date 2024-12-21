import { Keyboard } from "grammy"

export const mainMenuKeyboard: Keyboard = new Keyboard()
    .text("Сменить группу")
    .row()
    .text("Сегодня")
    .text("Завтра")
    .row()
    .text("Понедельник")
    .row()
    .resized()
