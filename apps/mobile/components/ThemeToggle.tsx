import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { MoonStarIcon, SunIcon } from "lucide-react-native";
import { Uniwind, useUniwind } from "uniwind";

export function ThemeToggle() {
  const { theme } = useUniwind();

  return (
    <Button
      variant="ghost"
      size="icon"
      onPress={() => Uniwind.setTheme(theme === "dark" ? "light" : "dark")}
      accessibilityLabel="Toggle theme">
      <Icon
        as={theme === "dark" ? MoonStarIcon : SunIcon}
        className="size-5 text-foreground"
      />
    </Button>
  );
}
