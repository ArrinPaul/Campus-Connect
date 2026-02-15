# Cluster Delta - Complete Feature Documentation

## Project Overview
Cluster Delta is a full-stack social media platform built with the MERN stack (MongoDB, Express.js, React, Node.js), designed specifically for students and research scholars to connect, collaborate, and participate in hackathons.

---

## 1. Authentication & User Management

### 1.1 User Registration & Login
- **Registration**: 
  - Comprehensive registration form with multiple fields
  - Pre-selected avatar system (11 default profile pictures)
  - Avatar selection drawer with visual preview
  - Skills input during registration (comma-separated)
  - Role selection (Student/Research Scholar)
  - Experience level selection (Beginner/Intermediate/Advanced/Expert)
  - Portfolio, GitHub, LinkedIn URL fields
  - University and graduation year
  - Email verification system
  - Password confirmation validation
  
- **Login**: 
  - Secure authentication with JWT tokens
  - Email and password authentication
  - Welcome screen on first login
  - Automatic redirect to home feed
  - Error handling with user-friendly messages
  
- **Password Reset**: 
  - Email-based password recovery system
  - Reset password page (UI ready, backend integration pending)
  
- **Email Verification**: Verification token system for new accounts

### 1.2 User Profiles
- **Profile Information**:
  - First Name, Last Name
  - Email (unique identifier)
  - Location
  - Profession
  - Profile Picture (via ImageKit integration or pre-selected avatars)
  - Verification Badge (tick mark for verified users)
  - Skills Array (with visual skill pills)
  - Role (student/research_scholar)
  - Experience Level (beginner/intermediate/advanced/expert)
  - Portfolio, GitHub, LinkedIn URLs
  - University & Graduation Year

- **Profile Features**:
  - View user profiles by ID
  - Edit profile modal with comprehensive form
  - Real-time skill management (add/remove skills with visual pills)
  - Profile picture upload (max 5MB, .jpg/.png/.jpeg)
  - Base64 image encoding for uploads
  - Profile view tracking
  - Joined date display (relative time)
  - Social media links (Instagram, Twitter, Facebook)
  - Follower modal to view all followers
  - Edit button visible only on own profile
  - Follow/Unfollow button on other profiles

### 1.3 User Roles
- **Student**: Default role for regular users
- **Research Scholar**: Advanced user type
- **Admin**: Access to admin dashboard with user management

---

## 2. Social Networking Features

### 2.1 Friend System
- **Friend Requests**: Send and receive friend requests
- **Accept/Deny Requests**: Manage incoming friend requests
- **Friend List**: View all connected friends
- **Friend Request Counter**: Track pending requests

### 2.2 Follow System
- **Follow Users**: Follow other users without mutual acceptance
- **Unfollow**: Remove users from following list
- **Followers List**: View all followers with modal display
- **Following Status**: Check if you're following a user
- **Follower Count**: Display number of followers

### 2.3 Skill-Based Friend Suggestions
- **Smart Recommendations**: Suggests friends based on matching skills
- **Skill Display**: Shows common skills in suggestions
- **Skill Pills**: Visual representation of user skills (up to 3 shown, with "+X more")

---

## 3. Post Management

### 3.1 Create Posts
- **Text Posts**: Share thoughts and updates
- **Image Upload**: Upload images via ImageKit CDN
- **Video Upload**: Support for .mp4 and .wav files (max 5MB)
- **Rich Text**: Automatic link detection and formatting
- **User Attribution**: Posts linked to user profiles

### 3.2 Post Interactions
- **Like System**: 
  - Like/unlike posts
  - Real-time like counter
  - Visual feedback (filled/unfilled heart icon)
  - Track who liked each post

- **Comment System**:
  - Comment on posts
  - Reply to comments
  - Like comments
  - Nested reply structure
  - Comment counter
  - Timestamp display (relative time)

- **Post Display**:
  - Show More/Show Less for long descriptions
  - Clickable links in post content
  - User profile links
  - Verification badge display
  - Post timestamp (relative)

### 3.3 Post Management
- **Delete Posts**: Users can delete their own posts
- **Get User Posts**: Fetch posts by specific user
- **Feed**: Chronological post feed (newest first)
- **No Posts State**: Friendly message when no posts available

---

## 4. Hackathon Management System

### 4.1 Hackathon Features
- **Create Hackathons**:
  - Name and description
  - Start and end dates
  - Location
  - Organizer information
  - Min/max team size constraints
  - Tags and categories
  - Status tracking (upcoming/ongoing/completed/cancelled)

- **View Hackathons**:
  - Grid layout display
  - Filter by status
  - Date range display
  - Tag visualization

### 4.2 Team Formation
- **Create Teams**:
  - Team name and description
  - Required skills specification (comma-separated input)
  - Technologies used (comma-separated input)
  - Project idea description
  - Maximum team size (default: 4)
  - Open/closed status toggle
  - Automatic creator as first member

- **Team Discovery**:
  - Browse teams by hackathon
  - Search teams by name/description/project idea
  - Filter by required skills
  - View team details (members, status, requirements)
  - Grid layout display

- **Join Requests**:
  - Request to join teams with detailed form
  - Showcase skills (comma-separated)
  - Specify experience level (dropdown: beginner/intermediate/advanced/expert)
  - Provide portfolio links (comma-separated)
  - Custom message to team owner
  - Request status tracking (pending/accepted/rejected)
  - Feedback field for rejected requests

### 4.3 Team Management
- **Team Owner Controls**:
  - Accept/reject join requests
  - View all pending requests
  - Remove team members
  - Toggle team open/closed status
  - Update team information

- **My Teams View**:
  - View all teams you're part of
  - See team status and member count
  - Manage teams you created

---

## 5. Notification System

### 5.1 Notification Features
- **Notification Types**:
  - Friend requests
  - Team invitations
  - Hackathon updates
  - Post interactions
  - System announcements

- **Notification Management**:
  - View all notifications in dedicated page
  - Mark individual as read
  - Mark all as read (bulk action)
  - Delete individual notifications
  - Priority levels (low/normal/high)
  - Read/unread visual distinction (opacity change)
  - Unread count endpoint available

- **Notification Display**:
  - Title and message
  - Timestamp
  - Metadata support (flexible object field)
  - Empty state message ("No Updates")
  - Action buttons (Mark read, Delete)
  - Responsive layout

---

## 6. AI Integration (Clu.ai)

### 6.1 AI Features
- **Embedded AI Interface**: iframe integration with external AI service
- **Loading State**: Displays loader while AI interface loads
- **Full-Screen Experience**: Optimized viewport usage
- **Mobile Navigation**: Accessible via bottom navigation bar

---

## 7. Admin Dashboard

### 7.1 User Management
- **User Statistics**:
  - Total users count
  - Users joined today
  - Users joined in last 30 days

- **User List Table**:
  - User ID
  - Username
  - Email
  - Join date (formatted)
  - Verification tick management

- **Verification System**:
  - Admin can grant/revoke verification badges
  - Checkbox interface for quick updates
  - Real-time tick status updates

---

## 8. UI/UX Features

### 8.1 Responsive Design
- **Mobile-First**: Optimized for mobile devices with responsive breakpoints
- **Tablet Support**: Adaptive layouts for tablets (md breakpoint)
- **Desktop View**: Full-featured desktop experience with sidebars
- **Bottom Navigation** (Mobile):
  - Feed (with fire icon)
  - Clu.ai (with sparkle icon, highlighted in gold)
  - Profile (with account icon)
  - Notifications/Updates (with campaign icon)
  - Fixed position at bottom
  - Icon-based navigation with labels

### 8.2 Theme System
- **Dark Mode**: Full dark theme support
- **Light Mode**: Default light theme
- **Theme Toggle**: Moon/Sun icon toggle in TopBar
- **Persistent Theme**: Theme preference saved in Redux store
- **Dynamic Styling**: Theme-aware component styling

### 8.3 Visual Elements
- **Profile Cards**: Compact user information display with edit capability
- **Friends Cards**: Friend list sidebar showing connections count
- **Post Cards**: Rich post display with interactions and verified badges
- **Loading States**: Skeleton loaders (react-loading-skeleton) and custom spinners
- **Welcome Screen**: First-time user welcome image (localStorage-based, shows once)
- **404 State**: Custom not-found page with illustration
- **Avatar System**: Pre-selected profile pictures in registration
- **Skill Pills**: Visual skill tags with delete functionality (dark background, white text)
- **Verification Badges**: Blue checkmark (FaCheckCircle) for verified users
- **Branded Login/Register**: 
  - Left-right split design with branding elements
  - Right side: Blue background with circular brand image
  - Floating badges: "Share", "Connect", "Interact"
  - Brand tagline: "Connect Minds, Ignite Ideas: Your Academic Hub for Collaborative Excellence"
  - TbSocial icon in black rounded square
  - "Cluster" brand name prominently displayed

### 8.4 Navigation
- **Top Bar**: 
  - Logo and brand name
  - Navigation links (Projects, Hackathons, Research)
  - Search bar (desktop only)
  - Theme toggle
  - Notification icon
  - Logout button
  - Responsive design (collapses on mobile)
  
- **Sidebar Navigation**: 
  - Left sidebar: Profile card and friends list (desktop)
  - Right sidebar: Friend requests and suggestions (desktop)
  
- **Bottom Navigation**: Mobile-optimized bottom bar with 4 main sections
- **Breadcrumbs**: Clear navigation paths with React Router

---

## 9. Media Management

### 9.1 ImageKit Integration
- **Image Upload**: CDN-based image storage
- **Image Optimization**: Automatic image processing
- **Secure Upload**: Authentication parameters
- **Folder Organization**: Organized file structure (/posts, /profiles)
- **Base64 Encoding**: Support for base64 image uploads

### 9.2 File Handling
- **Profile Pictures**: 
  - User avatar uploads (max 5MB)
  - Pre-selected avatar system (11 default avatars)
  - Avatar selection drawer with visual preview
  - Base64 encoding for profile images
  
- **Post Images**: Image attachments for posts via ImageKit
- **File Validation**: Type (.jpg, .png, .jpeg) and size restrictions
- **Preview Support**: Image preview before upload

### 9.3 Avatar System
- **Pre-selected Avatars**: 11 professionally designed profile pictures
- **Avatar Drawer**: Bottom drawer UI for avatar selection
- **Visual Selection**: Click to select with border highlight
- **Hosted on ImageKit**: All avatars hosted on CDN
- **Registration Integration**: Avatar selection during signup

---

## 10. Security Features

### 10.1 Authentication Security
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Token Expiration**: Automatic session management
- **Protected Routes**: Middleware-based route protection

### 10.2 Data Security
- **Input Validation**: Form validation on client and server
- **CORS Protection**: Configured CORS policies
- **Helmet.js**: Security headers
- **Environment Variables**: Sensitive data protection

---

## 11. API Architecture

### 11.1 RESTful Endpoints
- **Auth Routes**: `/auth/register`, `/auth/login`
- **User Routes**: `/users/*` (CRUD operations)
- **Post Routes**: `/posts/*` (post management)
- **Hackathon Routes**: `/hackathons/*`
- **Team Routes**: `/teams/*`
- **Notification Routes**: `/notifications/*`

### 11.2 Middleware
- **Authentication Middleware**: Token verification
- **Error Handling**: Centralized error management
- **Request Logging**: Morgan logger integration
- **Body Parsing**: JSON and form-data support

---

## 12. State Management

### 12.1 Redux Store
- **User Slice**: User authentication and profile state
- **Post Slice**: Post feed and interactions
- **Theme Slice**: Theme preferences
- **Redux Logger**: Development debugging

### 12.2 Local Storage
- **Token Persistence**: JWT token storage
- **Theme Preference**: Theme selection storage
- **Welcome Screen**: First-visit tracking

---

## 13. Additional Features

### 13.1 Search & Discovery
- **User Search**: Find users by name (TopBar search - UI ready)
- **Skill Filtering**: Filter teams and users by skills
- **Team Search**: Search teams by name, description, project idea
- **Hackathon Search**: Browse hackathons by status and tags

### 13.2 Real-Time Updates
- **Like Counter**: Instant like count updates without page reload
- **Follow Status**: Real-time follow/unfollow state changes
- **Notification Badge**: Live notification count (endpoint available)
- **Team Status**: Real-time team open/closed status updates

### 13.3 User Experience
- **Moment.js Integration**: Relative timestamps ("2 hours ago", "3 days ago")
- **React Hook Form**: Optimized form handling with validation
- **Loading Skeletons**: Smooth loading states for profile pages
- **Error Messages**: User-friendly error display with color coding
- **Success Feedback**: Confirmation messages for actions
- **Linkify**: Automatic URL detection and linking in posts
- **Show More/Less**: Expandable long post descriptions (300 char limit)
- **Image Preview**: Preview selected images before upload
- **Drawer Components**: Bottom drawer for avatar selection
- **Modal Components**: Edit profile, follower list modals

### 13.4 Placeholder Pages
- **Projects Page**: Navigation link exists, page not implemented
- **Research Page**: Navigation link exists, page not implemented
- These are planned features with UI navigation already in place

---

## Technology Stack Summary

### Frontend
- React 18.2.0
- Redux Toolkit
- React Router DOM
- Tailwind CSS
- Material-UI
- Axios
- React Hook Form
- Moment.js
- ImageKit React

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- Bcrypt
- Nodemailer
- Multer
- ImageKit
- Helmet.js
- Morgan

### Development Tools
- Nodemon
- Create React App
- ESLint
- Git

---

## Deployment
- **Frontend**: Vercel-ready
- **Backend**: Vercel serverless functions
- **Database**: MongoDB Atlas
- **CDN**: ImageKit for media storage
