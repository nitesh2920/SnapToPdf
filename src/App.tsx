// import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import { Analytics } from "@vercel/analytics/react"


// const queryClient = new QueryClient();

const App = () => (

    <>
    <Analytics/>
    <Sonner />
      <Index />
    </>
);

export default App;
