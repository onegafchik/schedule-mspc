import { XMLParser } from "fast-xml-parser"
import { Group, Schedule, ScheduleTuple } from "./types"
import { z, ZodError } from "zod"
import { ScheduleScheme } from "./schedule-scheme"
import moment, { Moment } from "moment-timezone"

function getCorrectNextMonday(currentDate: Moment): Moment {
	if (currentDate.day() === 0 || currentDate.day() === 1) {
		return currentDate.add(-2, "days").day(8)
	}

	return currentDate.day(8)
}

export class MSPCScheduleService {
	private static readonly schedules: ScheduleTuple = [undefined, undefined, undefined]

	private constructor() {}

	public static get getSchedules(): ScheduleTuple {
		return MSPCScheduleService.schedules
	}

	public static async request(url: string): Promise<void> {
		const dates: [Moment, Moment, Moment] = [moment(), moment().add(1, "days"), getCorrectNextMonday(moment())]

		let index: number = 0
		for await (const date of dates) {
			try {
				const response: Response = await fetch(
					new String(url).replace(
						/%252Fuploads%252F\d{4}%252F\d{2}%252F\d{2}%252E\d{2}%252E\d{4}%252/gm,
						`%252Fuploads%252F${date.format("YYYY")}%252F${date.format("MM")}%252F${date.format("DD")}%252E${date.format("MM")}%252E${date.format("YYYY")}%252`
					)
				)

				if (response.status !== 200 || !response.ok) {
					MSPCScheduleService.schedules[index] = undefined
					continue
				}

				const fetchedData: string = await response.text()
				const parsedData: z.infer<typeof ScheduleScheme> = ScheduleScheme.parse(
					new XMLParser().parse(fetchedData)
				)

				const schedule: Schedule = MSPCScheduleService.createSchedule(parsedData)

				MSPCScheduleService.schedules[index] = schedule
			} catch (error: unknown) {
				if (error instanceof ZodError) {
					console.log(`Error in data parsing: ${error.message}`)
				}

				MSPCScheduleService.schedules[index] = undefined
			} finally {
				index += 1
			}
		}
	}

	private static createSchedule(parsedData: z.infer<typeof ScheduleScheme>): Schedule {
		let firstRow: string | { T: string } = parsedData.Pages.Page[0].P[0]

		firstRow = typeof firstRow !== "string" ? firstRow.T : firstRow

		const date: string = firstRow.match(/\d{2}\.\d{2}\.\d{4}/)?.at(0) ?? ""

		const groups: Array<Group> = new Array<Group>()
		let bufferGroups: Array<Group> = new Array<Group>()

		parsedData.Pages.Page.forEach(({ P }) => {
			P.filter((PValue: string | { T: string }) => typeof PValue !== "string").forEach(({ T }) => {
				const row: Array<string> = T.split("│").filter((column: string) => column !== "")

				if (row.every((column: string) => /\d{2}[а-яА-Я]/.test(column))) {
					groups.push(...bufferGroups)

					bufferGroups = row.map(
						(column: string) =>
							({
								name: column.trim(),
								lessonsList: new Array<string>()
							}) as Group
					)
				} else if (bufferGroups.length !== 0 && T.split("").some((letter: string) => letter === "│")) {
					row.forEach((column: string, index: number) => {
						bufferGroups[index].lessonsList.push(column.replace(/;\&\#45\;|\&\#45/g, " "))
					})
				}
			})
		})

		if (bufferGroups.length !== 0) {
			groups.push(...bufferGroups)
		}

		return {
			date: date,
			groups: groups
		} as Schedule
	}
}
