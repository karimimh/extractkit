import { LayersProvider } from "@images/context/layers/layers-context";
import { ThemeProvider } from "@images/context/theme/theme-context";
import { UIProvider } from "@images/context/ui/ui-context";
import HomePage from "@images/components/home-page/home-page";

export default function App() {
  return (
    <UIProvider>
      <LayersProvider>
        <ThemeProvider>
          <HomePage />
        </ThemeProvider>
      </LayersProvider>
    </UIProvider>
  );
}
