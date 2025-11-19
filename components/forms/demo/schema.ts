import z from "zod";

export const formSchema = z.object({
  // accepts only YouTube URLs
  youtubeURL: z
    .url()
    .regex(
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/)?([a-zA-Z0-9_-]{11})/,
      {
        message: "Input must be a valid YouTube URL"
      }
    )
});

export type FormSchema = z.infer<typeof formSchema>;
