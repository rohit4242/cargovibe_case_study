import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";

export function BusyLabel({ busy, children }: { busy?: boolean; children: string }) {
  return (
    <>
      {busy ? <Spinner /> : null}
      <Text>{children}</Text>
    </>
  );
}
