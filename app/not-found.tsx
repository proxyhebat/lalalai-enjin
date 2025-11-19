import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="font-sans flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="text-8xl font-bold mb-4">404</div>
      <h1 className="text-3xl font-semibold mb-2">Whoopsie! Page Not Found</h1>
      <p className="text-base mb-8 max-w-md">
        Looks like this page took a detour through the Hollows! No worries,
        let&apos;s rewind back to Random Play <br /> and find some epic clips~
      </p>
      <Link href="/">
        <Button>Back to Home</Button>
      </Link>
    </div>
  );
}
