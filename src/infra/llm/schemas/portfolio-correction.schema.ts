import z from "zod";

export const correctionSchema = z.object({
    detailInfo: z.object({
        lines: z.array(
            z.object({
                line_number: z.string(),
                original_content: z.string(),
                type: z.number(),
                review_comment: z.string().nullable(),
            })
        ),
        field_summary: z.string(),
    }),
    assignedTasks: z.object({
        lines: z.array(
            z.object({
                line_number: z.string(),
                original_content: z.string(),
                type: z.number(),
                review_comment: z.string().nullable(),
            })
        ),
        field_summary: z.string(),
    }),
    keyAchievements: z.object({
        lines: z.array(
            z.object({
                line_number: z.string(),
                original_content: z.string(),
                type: z.number(),
                review_comment: z.string().nullable(),
            })
        ),
        field_summary: z.string(),
    }),
    insights: z.object({
        lines: z.array(
            z.object({
                line_number: z.string(),
                original_content: z.string(),
                type: z.number(),
                review_comment: z.string().nullable(),
            })
        ),
        field_summary: z.string(),
    }),
});

export type Correction = z.infer<typeof correctionSchema>;
