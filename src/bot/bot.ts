import { Bot, BotError, Context, GrammyError, HttpError, session } from "grammy"
import { BotContext } from "./types"
import { freeStorage } from "@grammyjs/storage-free"
import { limit } from "@grammyjs/ratelimiter"
import { changeGroupHandler, getScheduleHandler, setGroupHandler, startCommandHandler } from "./handlers"

export class MSPCBot {
	private readonly bot: Bot<BotContext>

	private readonly phrasesForGetSchedule: Array<string> = new Array<string>("Сегодня", "Завтра", "Понедельник")

	public constructor(private readonly apiToken: string) {
		try {
			this.bot = new Bot<BotContext>(apiToken)
		} catch (error: unknown) {
			if (error instanceof GrammyError) {
				console.log("RAR")
				return
			}
		}

		this.bot
			.use(
				session({
					initial: () => ({
						isWaitingForNewGroup: true,
						group: undefined
					}),
					storage: freeStorage(this.apiToken)
				})
			)
			.use(
				limit({
					timeFrame: 10 * 1000,
					limit: 10,
					onLimitExceeded: async (context: Context) => await context.reply("Спам - это плохо. Не делайте так")
				})
			)

		this.bot.command("start", startCommandHandler)

		this.bot.hears(/^\d{2}[A-ZА-Я]$/, setGroupHandler)
		this.bot.hears("Сменить группу", changeGroupHandler)

		this.bot.hears(this.phrasesForGetSchedule, (context: BotContext) =>
			getScheduleHandler(
				context,
				this.phrasesForGetSchedule.findIndex((phrase: string) => phrase === context.message?.text)
			)
		)

		this.bot.catch((botError: BotError<BotContext>) => {
			const error: unknown = botError.error

			if (error instanceof GrammyError) {
				console.log(`Bot error: ${error.message}`)
			} else if (error instanceof HttpError) {
				console.log(`Could not contact with Telegram: ${error.message}`)
			} else {
				console.log(error)
			}
		})
	}

	public start(): void {
		this.bot.start()
	}

	public stop(): void {
		this.bot.stop()
	}
}
