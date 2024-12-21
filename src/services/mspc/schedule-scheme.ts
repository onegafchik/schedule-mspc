import { z } from "zod"

export const ScheduleScheme = z.object({
    Pages: z.object({
        Page: z.array(
            z.object({
                P: z.array(
                    z.union([
                        z.string(),
                        z.object({
                            T: z.string()
                        })
                    ])
                )
            })
        )
    })
})
