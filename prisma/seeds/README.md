# 🌱 Mirai Seed System - Complete Guide

## 📋 Overview
Comprehensive database seeding system using Faker.js to generate realistic test data for the Mirai project management application.

## 🚀 Quick Start
```bash
# Generate fresh test data
npm run seed

# Same command (clean + seed)
npm run seed:clean
```

## 📊 What Gets Generated

### 👥 **Users (15 total)**
- Realistic names, emails, and avatars
- Bcrypt-hashed passwords (`Password123`)
- Mix of different user roles and profiles

### 🏢 **Organizations (3 total)**
- Company names with descriptions
- Member relationships with roles (ADMIN/MEMBER)
- Organization-based isolation

### 👥 **Teams (8 total)**
- 2-4 teams per organization
- Realistic team names (Frontend Development, Data Science, etc.)
- Team leaders and members with proper roles
- Team objectives and descriptions

### 📋 **Boards (17 total)**
- 1-3 boards per team
- Project templates (Sprint Planning, Bug Tracking, etc.)
- Default Kanban columns (Backlog → To Do → In Progress → Review → Done)
- Team-based access controls with proper roles

### 📝 **Tasks (184 total)**
- 8-15 realistic tasks per board
- Proper assignees from board members
- Status based on column placement
- Due dates, priorities, and descriptions
- Task activity logs for history tracking

### 📈 **Performance Metrics (660 entries)**
- Weekly and monthly metrics for each team member
- Last 12 weeks + 3 months of data
- Realistic completion rates and productivity scores
- On-time delivery tracking
- Working hours and activity tracking

## 📁 File Structure
```
prisma/seeds/
├── index.ts              # Master orchestrator
├── users.seed.ts         # User generation
├── organizations.seed.ts # Organizations + memberships
├── teams.seed.ts         # Teams + team members
├── boards.seed.ts        # Boards + columns + access
├── tasks.seed.ts         # Tasks + assignees + activity logs
└── performance.seed.ts   # Performance analytics data
```

## 🔄 Seed Process Flow
1. **Clean Phase**: Removes all existing data (respects foreign keys)
2. **Generation Phase**: Creates data in dependency order
   - Users → Organizations → Teams → Boards → Tasks → Performance Metrics

## 🎯 Key Features

### ✅ **Security Compliant**
- All foreign key constraints respected
- Proper organization-based data isolation
- Role-based access controls implemented

### ✅ **Realistic Data**
- Task completion follows realistic timelines
- Performance metrics calculated from actual task data
- Team structures mirror real organizations

### ✅ **Analytics Ready**
- Performance metrics span multiple time periods
- Completion rates, productivity scores calculated
- Task activity logs provide detailed history

### ✅ **Performance Testing**
- Large dataset (660 performance entries)
- Multiple organizations for multi-tenancy testing
- Varied task statuses and completion patterns

## 🛠 Development Usage

### Adding New Seed Data
1. Create new seed file in `prisma/seeds/`
2. Follow existing pattern with clean/seed functions
3. Add to `index.ts` orchestrator
4. Respect dependency order

### Customizing Data Volume
Edit the constants in seed files:
- Users: Change `userCount` in `users.seed.ts`
- Teams: Modify `teamCount` range in `teams.seed.ts`
- Tasks: Adjust `taskCount` range in `tasks.seed.ts`

### Testing Specific Scenarios
```bash
# Run individual seed files (if needed)
tsx prisma/seeds/users.seed.ts
tsx prisma/seeds/performance.seed.ts
```

## 📈 Performance Analytics Testing
The generated data provides comprehensive test scenarios for:
- **Personal Dashboard**: Individual user metrics across time periods
- **Team Performance**: Aggregated team statistics
- **Organization Analytics**: Company-wide performance tracking
- **Time Period Comparison**: Weekly vs monthly vs quarterly data

## 🎉 Result Summary
After running `npm run seed`:
- ✅ 15 Users with realistic profiles
- ✅ 3 Organizations with member hierarchies  
- ✅ 8 Teams with proper leadership structure
- ✅ 17 Boards with Kanban workflows
- ✅ 184 Tasks with realistic progression
- ✅ 660 Performance metrics for analytics testing

Perfect for testing the Performance Analytics Phase 1 implementation! 🚀
