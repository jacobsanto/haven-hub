

## Grant Admin Access

This plan will add your account as an administrator so you can access the `/admin` dashboard and manage the website.

### What Will Be Done

1. **Insert Admin Role**
   - Add a record to the `user_roles` table linking your user account to the `admin` role
   - Your account: iakovos@ariviagroup.com

### Database Change

A single SQL insert will be executed:

```text
INSERT INTO user_roles (user_id, role)
VALUES ('2d00fd6a-b7aa-4e2f-ac80-8b80deaf6801', 'admin')
```

### After Completion

Once this is done, you will be able to:
- Access the Admin Dashboard at `/admin`
- Manage properties, bookings, availability
- Edit destinations and experiences
- Manage blog posts, authors, and categories
- Update brand settings (colors, logo, contact info)
- View newsletter subscribers and enquiries

### No Code Changes Required

The authentication system is already set up to check for admin roles. Once the database record is added, simply:
1. Log out of your current session
2. Log back in
3. Click on your profile icon and select "Admin Dashboard"

---

### Technical Notes

- The `user_roles` table uses RLS policies that allow admins to manage all roles
- The `has_role()` security definer function is already in place for safe role checking
- The `AdminGuard` component in the codebase will automatically recognize your admin status

