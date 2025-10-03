# Router Structure

This folder contains all route definitions organized by route type and functionality.

## Structure

```
src/router/
├── index.ts           # Main router export combining all routes
├── publicRoutes.tsx   # Public routes (landing, not-found, etc.)
├── redirectRoutes.tsx # Redirect routes for backward compatibility
├── appRoutes.tsx      # Protected app routes with AppLayout
├── constants.ts       # Route constants and utilities
└── README.md          # This documentation
```

## Route Organization

### Public Routes (`publicRoutes.tsx`)

Routes that don't require authentication or app layout:

- `/` - Landing page
- `*` - 404 Not Found page (catch-all)

### Redirect Routes (`redirectRoutes.tsx`)

Legacy URL redirects for backward compatibility:

- `/jobs` → `/app/jobs`
- `/candidates` → `/app/candidates/kanban`
- `/dashboard` → `/app/dashboard`

### App Routes (`appRoutes.tsx`)

Protected routes that use the AppLayout wrapper:

- `/app` - Dashboard (index)
- `/app/dashboard` - Dashboard
- `/app/jobs` - Jobs management
- `/app/candidates/list` - Candidates list view
- `/app/candidates/kanban` - Candidates kanban view
- `/app/candidates/:id` - Individual candidate profile
- `/app/assessments` - Assessments management
- `/app/analytics` - Analytics (currently shows Dashboard)
- `/app/settings` - Settings (currently shows Dashboard)

## Usage

### Import Route Groups (Recommended)

```typescript
import { publicRoutes, redirectRoutes, appRoutes } from "@/router";

// Use in Router component
<Routes>
  {publicRoutes.map((route, index) => (
    <Route
      key={index}
      path={route.path}
      element={route.element}
    />
  ))}
  {/* ... other routes */}
</Routes>;
```

### Use Route Constants for Type-Safe Navigation

```typescript
import { ROUTES, getCandidateProfileRoute } from "@/router";
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();

// Navigate to dashboard
navigate(ROUTES.DASHBOARD);

// Navigate to candidate profile
const candidateId = "123";
navigate(getCandidateProfileRoute(candidateId));
```

### Import Specific Route Groups

```typescript
import { appRoutes, publicRoutes, redirectRoutes } from "@/router";

// Use specific route groups
<Routes>
  {publicRoutes.map((route, index) => (
    <Route
      key={index}
      {...route}
    />
  ))}
  {redirectRoutes.map((route, index) => (
    <Route
      key={index}
      {...route}
    />
  ))}
  {appRoutes.map((route, index) => (
    <Route
      key={index}
      {...route}
    />
  ))}
</Routes>;
```

## Adding New Routes

### Adding a New Public Route

1. Edit `publicRoutes.tsx`
2. Add the new route object to the array

### Adding a New App Route

1. Edit `appRoutes.tsx`
2. Add the new route to the children array of the `/app` route

### Adding a New Route Group

1. Create a new file (e.g., `adminRoutes.tsx`)
2. Export the routes array
3. Import and combine in `index.ts`

### Use Route Metadata for Navigation Menus

```typescript
import { routeMetadata, ROUTES } from "@/router";

// Filter routes for navigation menu
const navigationRoutes = routeMetadata.filter(
  (route) => route.showInNavigation
);

// Generate navigation menu
{
  navigationRoutes.map((route) => (
    <NavLink
      key={route.path}
      to={route.path}>
      {route.title}
    </NavLink>
  ));
}
```

## Route Constants

All route paths are defined as constants in `constants.ts` for type-safe navigation:

- `ROUTES.HOME` - Landing page
- `ROUTES.DASHBOARD` - Main dashboard
- `ROUTES.JOBS` - Jobs management
- `ROUTES.CANDIDATES_LIST` - Candidates list view
- `ROUTES.CANDIDATES_KANBAN` - Candidates kanban view
- `ROUTES.CANDIDATE_PROFILE` - Individual candidate (with :id parameter)
- `ROUTES.ASSESSMENTS` - Assessments management
- And more...

## Route Structure Benefits

- **Organized by Purpose**: Routes grouped by functionality
- **Maintainable**: Easy to find and modify specific route types
- **Scalable**: Simple to add new route groups as the app grows
- **Type Safe**: Full TypeScript support with RouteObject types
- **Flexible**: Can import all routes or specific groups as needed
- **Constants**: Type-safe route constants prevent typos in navigation
- **Metadata**: Rich route information for menus and navigation
