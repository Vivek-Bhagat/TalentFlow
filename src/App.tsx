// import { Toaster } from "@/components/ui/toaster";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { initializeApp } from "./lib/init-app";
import { publicRoutes, redirectRoutes, appRoutes } from "./router";
import { ThemeProvider } from "@/components/theme-provider";
import { Loader } from "lucide-react";

const queryClient = new QueryClient();

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <Loader className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const App = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeApp()
      .then(() => setIsInitialized(true))
      .catch(console.error);
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          
          <Loader className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing TalentFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider
      defaultTheme="light"
      storageKey="talentflow-ui-theme">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster
            position="bottom-right"
            // visibleToasts={TOAST_LIMIT}
            expand={false}
            closeButton
            richColors
          />
          {/* <Sonner /> */}
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                {publicRoutes.map((route, index) => (
                  <Route
                    key={`public-${index}`}
                    path={route.path}
                    element={route.element}
                  />
                ))}

                {/* Redirect Routes */}
                {redirectRoutes.map((route, index) => (
                  <Route
                    key={`redirect-${index}`}
                    path={route.path}
                    element={route.element}
                  />
                ))}

                {/* App Routes */}
                {appRoutes.map((route, index) => (
                  <Route
                    key={`app-${index}`}
                    path={route.path}
                    element={route.element}>
                    {route.children?.map((childRoute, childIndex) => (
                      <Route
                        key={`child-${childIndex}`}
                        index={childRoute.index}
                        path={childRoute.path}
                        element={childRoute.element}
                      />
                    ))}
                  </Route>
                ))}
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
