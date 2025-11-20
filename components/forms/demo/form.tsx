"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";

import { api } from "@/enjin/_generated/api";

import { formSchema, FormSchema } from "./schema";

export function DemoForm() {
  const kickstart = useMutation(api.clips.kickstartClipsGenerationWorkflow);
  const router = useRouter();
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      youtubeURL: ""
    }
  });

  const onSubmit = async ({ youtubeURL }: FormSchema) => {
    const result = await kickstart({ youtubeURL });
    toast.success("Clip generation started!", {
      // TODO: implement seconds countdown
      description: `Your video will be processed shortly. You will be redirected in 4 seconds.`,
      duration: 4000,
      action: {
        label: "View",
        onClick: () => router.push(`/clips/${result.clipId}`)
      }
    });
    setTimeout(() => {
      router.push(`/clips/${result.clipId}`);
    }, 4000);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="youtubeURL"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-primary">
                Fill the box with the YouTube video URL then press{" "}
                <Kbd>enter</Kbd>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
