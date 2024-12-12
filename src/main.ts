import "dotenv/config"

import { MSPCBot } from "./bot"
import { MSPCScheduleService } from "./services/mspc"
import moment from "moment-timezone"
import { scheduleJob } from "node-schedule"
import { range } from "./utils"

class App {
	private static instance: App | undefined = undefined

	private readonly timezone: string = "Europe/Minsk"

	private bot: MSPCBot = new MSPCBot(process.env.TELEGRAM_API_TOKEN ?? "")

	public constructor() {
		if (App.instance) {
			return App.instance
		} else {
			App.instance = this
		}

		moment.tz.setDefault(this.timezone)
	}

	public run(): void {
		console.log(`App is running...`)

		this.requestForSchedule()
		this.bot.start()

		scheduleJob(
			{
				hour: 0,
				minute: 0,
				tz: this.timezone
			},
			this.requestForSchedule
		)

		for (const hour of range(10)) {
			for (const minute of range(3)) {
				scheduleJob(
					{
						hour: hour + 8,
						minute: minute * 20,
						tz: this.timezone
					},
					this.requestForSchedule
				)
			}
		}
	}

	private requestForSchedule(): void {
		console.log(`[${moment().format("DD.MM HH.mm")}]: Updating the schedule...`)

		MSPCScheduleService.request(process.env.MSPC_SCHEDULE_URL ?? "").finally(() =>
			console.log(`[${moment().format("DD.MM HH:mm")}]: Schedule updated`)
		)
	}
}

new App().run()
