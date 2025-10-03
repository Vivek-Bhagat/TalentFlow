// React imports
import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence,  } from "framer-motion";

// Icon imports
import {
  Users,
  FileText,
  Menu,
  X,
  Home,
  LogOut,
  KanbanIcon,
  Leaf,
  BriefcaseBusiness,
  ArrowLeftRight,
  
  GemIcon,
  Settings,
  UserCircle,
  Bell,
  HelpCircle,
} from "lucide-react";

// Component imports
import { Button } from "@/components/ui/button";
import { NotificationBellWithDialog } from "./Notification";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";

// Navigation configuration
const navigation = [
  { name: "Dashboard", href: "/app", icon: Home },
  { name: "Jobs", href: "/app/jobs", icon: BriefcaseBusiness },
  { name: "Candidates", href: "/app/candidates/list", icon: Users },
  { name: "Kanban View", href: "/app/candidates/kanban", icon: KanbanIcon },
  { name: "Assessments", href: "/app/assessments", icon: FileText },
  // Future navigation items
  // { name: "Analytics", href: "/analytics", icon: BarChart3 },
  // { name: "Settings", href: "/settings", icon: Settings },
];

/**
 * Main application layout component
 * Provides a responsive sidebar navigation and main content area
 * Features:
 * - Collapsible sidebar for desktop
 * - Mobile-friendly overlay sidebar
 * - Keyboard shortcuts (Ctrl/Cmd + B)
 * - Auto-responsive behavior based on screen size
 */
export function AppLayout() {
  // ===== STATE MANAGEMENT =====
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar visibility
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // Desktop sidebar collapse state
  const [userMenuOpen, setUserMenuOpen] = useState(false); // User dropdown menu visibility
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  ); // Track window width

  // ===== HOOKS =====
  const location = useLocation();
  const navigate = useNavigate();

  // ===== EVENT HANDLERS =====

  /**
   * Handles user logout
   * Clears session data and redirects to home page
   */
  const handleLogout = () => {
    // TODO: Clear any stored session data here if needed
    navigate("/", { replace: true });
  };

  /**
   * Toggles the sidebar collapsed state
   * Only affects desktop view (lg+ breakpoints)
   */
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // ===== EFFECTS =====

  /**
   * Keyboard shortcut handler
   * Enables Ctrl/Cmd + B to toggle sidebar
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  /**
   * Enhanced responsive sidebar behavior with smooth transitions
   * Auto-collapses sidebar on medium screens (1024px - 1366px)
   * Auto-expands on large screens (>= 1366px)
   * Includes debouncing for better performance
   */
  useEffect(() => {
    let resizeTimeout: number;

    const handleResize = () => {
      clearTimeout(resizeTimeout);

      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        setWindowWidth(width);

        if (width >= 1024 && width < 1366) {
          // Medium desktop: auto-collapse to save space
          setSidebarCollapsed(true);
        } else if (width >= 1366) {
          // Large desktop: auto-expand for full functionality
          setSidebarCollapsed(false);
        }
        // Mobile (< 1024px): no change to collapsed state, handled by mobile overlay

        // Close mobile sidebar on resize to larger screens
        if (width >= 1024 && sidebarOpen) {
          setSidebarOpen(false);
        }
      }, 150); // Debounce resize events
    };

    // Only run if window is available (client-side)
    if (typeof window !== "undefined") {
      // Set initial state based on current window size
      handleResize();

      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(resizeTimeout);
      };
    }
  }, [sidebarOpen]);

  // ===== RENDER =====
  return (
    <motion.div
      className="flex h-screen bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}>
      {/* ===== ENHANCED MOBILE SIDEBAR BACKDROP ===== */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSidebarOpen(false);
              }
            }}
            aria-label="Close sidebar"
            tabIndex={0}
          />
        )}
      </AnimatePresence>

      {/* ===== SIDEBAR ===== */}
      <motion.div
        className={cn(
          // Base styles with simple design
          "fixed inset-y-0 left-0 z-50 bg-card border-r border-border shadow-lg",
          // Desktop positioning
          "lg:translate-x-0 lg:static lg:inset-0 lg:shadow-none",
          // Desktop width - responsive based on collapsed state
          sidebarCollapsed ? "lg:w-20" : "lg:w-60",
          // Mobile width - slightly wider for better touch targets
          "w-80 sm:w-72"
        )}
        initial={{ x: -320 }}
        animate={{
          x: sidebarOpen ? 0 : windowWidth >= 1024 ? 0 : -320,
          width:
            windowWidth >= 1024
              ? sidebarCollapsed
                ? 80
                : 240
              : windowWidth >= 640
              ? 288
              : 320,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3,
        }}>
        <div className="flex h-full flex-col">
          {/* ===== LOGO SECTION ===== */}
          <motion.div
            className="flex h-16 items-center justify-between px-4 lg:px-6 border-b border-border"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            {/* Logo and brand name */}
            <motion.div
              className={cn(
                "flex items-center transition-all duration-300",
                sidebarCollapsed && windowWidth >= 1024
                  ? "lg:justify-center lg:w-full"
                  : "space-x-3"
              )}
              animate={{
                justifyContent:
                  sidebarCollapsed && windowWidth >= 1024
                    ? "center"
                    : "flex-start",
                width:
                  sidebarCollapsed && windowWidth >= 1024 ? "100%" : "auto",
              }}
              transition={{ duration: 0.3 }}>
              {/* Simple brand icon */}
              <motion.div
                className="w-8 h-8 bg-gradient-to-tr  from-blue-600 to-purple-800 rounded-lg flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                <Leaf className="w-5 h-5 text-white" />
              </motion.div>

              {/* Simple brand text */}
              <motion.div
                className="transition-all duration-300"
                animate={{
                  opacity: sidebarCollapsed && windowWidth >= 1024 ? 0 : 1,
                  width: sidebarCollapsed && windowWidth >= 1024 ? 0 : "auto",
                  display:
                    sidebarCollapsed && windowWidth >= 1024 ? "none" : "block",
                }}
                transition={{ duration: 0.3 }}>
                <h1 className="text-xl font-bold ">
                  TalentFlow
                </h1>
                <p className="text-xs text-muted-foreground">Hiring Platform</p>
              </motion.div>
            </motion.div>

            {/* Enhanced action buttons */}
            <div className="flex items-center space-x-2">
              {/* Mobile close button with improved styling */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden hover:bg-red-500 hover:text-red-500 text-muted-foreground transition-all duration-200 rounded-lg p-2"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar">
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* ===== NAVIGATION MENU ===== */}
          <motion.nav
            className={cn(
              "flex-1 py-4 space-y-1 transition-all duration-300",
              sidebarCollapsed && windowWidth >= 1024
                ? "lg:px-2"
                : "px-3 lg:px-4"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}>
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;

              // nav sidebar menu items
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                  whileHover={{ x: 5 }}>
                  <NavLink
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center text-sm font-medium rounded-lg transition-all duration-200 relative group",
                      isActive
                        ? "bg-blue-500 text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      sidebarCollapsed && windowWidth >= 1024
                        ? "lg:justify-center lg:px-0 lg:py-2 lg:w-10 lg:h-10 lg:mx-auto lg:rounded-lg"
                        : "px-3 py-2"
                    )}
                    title={
                      sidebarCollapsed && windowWidth >= 1024
                        ? item.name
                        : undefined
                    }>
                    {/* Navigation icon - centered when collapsed */}
                    <div
                      className={cn(
                        "flex items-center justify-center transition-all duration-200",
                        sidebarCollapsed && windowWidth >= 1024
                          ? "lg:mr-0"
                          : "mr-3"
                      )}>
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                    </div>

                    {/* Navigation text */}
                    <span
                      className={cn(
                        "transition-all duration-300",
                        sidebarCollapsed && windowWidth >= 1024
                          ? "lg:hidden lg:opacity-0 lg:w-0"
                          : "opacity-100"
                      )}>
                      {item.name}
                    </span>

                    {/* Simple tooltip for collapsed state */}
                    {sidebarCollapsed && windowWidth >= 1024 && (
                      <div className="hidden lg:group-hover:block absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border z-50 whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </motion.nav>

          {/* ===== USER PROFILE SECTION ===== */}
          <div
            className={cn(
              "border-t border-border transition-all duration-300",
              sidebarCollapsed && windowWidth >= 1024 ? "lg:p-2" : "p-3 lg:p-2"
            )}>
            <div
              className={cn(
                "flex items-center rounded-lg bg-muted/50 border border-border/50 transition-all duration-300 hover:shadow-sm group",
                sidebarCollapsed && windowWidth >= 1024
                  ? "lg:justify-center lg:p-2 lg:w-10 lg:h-10 lg:mx-auto lg:rounded-lg"
                  : "p-3 space-x-3"
              )}>
              {/* Simple user avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-4xl flex items-center justify-center transition-all duration-200">
                  <span className="text-xs font-bold text-primary-foreground">
                    HR
                  </span>
                </div>
                {/* Simple status indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
              </div>

              {/* User details */}
              <div
                className={cn(
                  "flex-1 min-w-0 transition-all duration-300",
                  sidebarCollapsed && windowWidth >= 1024
                    ? "lg:hidden lg:opacity-0 lg:w-0"
                    : "opacity-100"
                )}>
                <p className="text-sm font-medium text-foreground">HR Admin</p>
                <p className="text-xs text-muted-foreground">
                  hr@talentflow.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ===== NAVBAR SECTION ===== */}
        <motion.header
          className="h-16 bg-background border-b border-border flex items-center justify-between px-4 lg:px-4 shadow-sm"
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}>
          {/* Left section - navigation controls and title */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar">
                <Menu className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Desktop sidebar toggle button */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={
                  sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                }>
                <motion.div
                  animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                  transition={{ duration: 0.3 }}>
                  <ArrowLeftRight className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>

            {/* Page title */}
            <div className="flex items-center space-x-3">
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center space-x-2">
                {/* Page icon */}
                <div className="hidden sm:flex w-8 h-8 bg-primary rounded-lg items-center justify-center">
                  {(() => {
                    const currentPage = navigation.find(
                      (item) => item.href === location.pathname
                    );
                    const IconComponent = currentPage?.icon || Home;
                    return <IconComponent className="h-4 w-4 text-white" />;
                  })()}
                </div>

                <div>
                  <h2 className="text-lg font-semibold ">
                    {navigation.find((item) => item.href === location.pathname)
                      ?.name || "TalentFlow"}
                  </h2>
                  <div className="text-xs text-muted-foreground hidden sm:block">
                    Streamline your hiring workflow
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right section - user actions and notifications */}
          <div className="flex items-center space-x-2">
            {/* Search button - hidden on mobile */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex bg-emerald-50 hover:bg-emerald-100">
                <GemIcon className="h-4 w-4 text-emerald-600" />
              </Button>
            </motion.div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification bell with dialog */}
            <NotificationBellWithDialog />

            {/* Divider - hidden on mobile */}
            <div className="hidden sm:block h-6 w-px bg-border mx-2"></div>

            {/* User profile dropdown */}
            <Popover
              open={userMenuOpen}
              onOpenChange={setUserMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 bg-accent/50 rounded-lg p-2  hover:bg-accent/70 transition-colors duration-200 "
                  aria-label="User menu">
                  {/* User avatar */}
                  <div className="relative">
                    <div className="w-7 h-7 bg-purple-500 rounded-4xl flex items-center justify-center">
                      <span className="text-xs font-bold text-primary-foreground">
                        HR
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></div>
                  </div>

                  {/* User info - hidden on mobile */}
                  {/* <div className="hidden md:block text-left">
                    <p className="text-sm  text-foreground">HR Admin</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div> */}

                  {/* Dropdown chevron */}
                  {/* <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 data-[state=open]:rotate-180" /> */}
                </Button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                className="w-64 p-2"
                sideOffset={8}>
                <div className="space-y-1">
                  {/* User info header */}
                  <div className="px-3 py-2 border-b border-border mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-4xl flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-foreground">
                          HR
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          HR Admin
                        </p>
                        <p className="text-xs text-muted-foreground">
                          hr@talentflow.com
                        </p>
                        <div className="flex items-center space-x-1 mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-green-600">Online</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="space-y-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-2 h-auto hover:bg-accent"
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Navigate to profile
                      }}>
                      <UserCircle className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Profile</div>
                        <div className="text-xs text-muted-foreground">
                          Manage your account
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-2 h-auto hover:bg-accent"
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Navigate to settings
                      }}>
                      <Settings className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Settings</div>
                        <div className="text-xs text-muted-foreground">
                          Preferences & configuration
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-2 h-auto hover:bg-accent"
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Navigate to notifications
                      }}>
                      <Bell className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">Notifications</div>
                        <div className="text-xs text-muted-foreground">
                          Manage alerts & updates
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start px-3 py-2 h-auto hover:bg-accent"
                      onClick={() => {
                        setUserMenuOpen(false);
                        // Navigate to help
                      }}>
                      <HelpCircle className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="text-sm font-medium">
                          Help & Support
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Get assistance
                        </div>
                      </div>
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-2"></div>

                  {/* Logout button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start px-3 py-2 h-auto hover:bg-destructive/70 hover:text-white"
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}>
                    <LogOut className="h-4 w-4 mr-3" />
                    <div className="text-left">
                      <div className="text-sm font-medium">Sign Out</div>
                    </div>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </motion.header>

        {/* ===== MAIN CONTENT OUTLET ===== */}
        <motion.main
          className="flex-1 overflow-auto bg-background"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}>
          <div className="min-h-full">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </motion.div>
  );
}
