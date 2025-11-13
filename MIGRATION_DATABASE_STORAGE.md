# Migration: File Storage to Database Storage

## What Changed

### Before (Old System)
- ID verification images saved to `uploads/` folder or AWS S3
- Database stored **file paths** like: `"id_proof/user-123/id-front.jpg"`
- Required file system or S3 access to view images

### After (New System)
- ID verification images saved **directly in database** as base64
- Database stores **complete data URLs** like: `"data:image/jpeg;base64,/9j/4AAQSkZJRg..."`
- No file system or S3 needed

## Benefits

✅ **Simpler Deployment**: No need to configure AWS S3 or manage uploads folder  
✅ **Database Backups**: Images automatically backed up with database  
✅ **No File Sync Issues**: Everything in one place  
✅ **Easier Migration**: Just backup/restore database  
✅ **No Missing Files**: Can't lose files due to file system errors

## Database Schema

No schema changes required! The same columns are used:
```sql
idFrontUrl: text    -- Now stores: "data:image/jpeg;base64,..." instead of "id_proof/user-123/..."
idBackUrl: text     -- Now stores: "data:image/jpeg;base64,..." instead of "id_proof/user-123/..."
selfieUrl: text     -- Now stores: "data:image/jpeg;base64,..." instead of "id_proof/user-123/..."
```

## Migration for Existing Data

If you have existing loan applications with file paths in the database:

### Option 1: Leave Legacy Data (Recommended)
The system is **backward compatible**:
- Old records with file paths: System tries to load from `uploads/` folder
- New records: Base64 data stored directly
- No migration needed

### Option 2: Migrate Old Files to Database
If you want to convert old file paths to base64:

```javascript
// Migration script (run once)
import fs from 'fs';
import path from 'path';

async function migrateFilesToDatabase() {
  const applications = await db.getAllLoanApplications();
  
  for (const app of applications) {
    // Check if it's a file path (not base64)
    if (app.idFrontUrl && !app.idFrontUrl.startsWith('data:')) {
      const filePath = path.join('uploads', app.idFrontUrl);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const base64 = fileBuffer.toString('base64');
        const ext = path.extname(filePath).substring(1);
        const mimeType = ext === 'pdf' ? 'application/pdf' : `image/${ext}`;
        const dataUrl = `data:${mimeType};base64,${base64}`;
        
        // Update database
        await db.updateLoanApplication(app.id, {
          idFrontUrl: dataUrl
        });
      }
    }
    
    // Repeat for idBackUrl and selfieUrl
    // ...
  }
}
```

## Storage Considerations

### Database Size
- Each image: ~500KB - 2MB (base64 encoded)
- 3 images per application: ~1.5MB - 6MB per loan
- 1,000 loans: ~1.5GB - 6GB database storage

### MySQL Configuration
Ensure your MySQL has sufficient limits:
```ini
# my.cnf or my.ini
max_allowed_packet = 64M  # Allow large INSERT queries
```

### TiDB Cloud (Your Current Database)
✅ TiDB automatically handles large text fields  
✅ No configuration needed  
✅ Scales automatically

## Testing

1. **Apply for a new loan** with ID uploads
2. **Check database** - verify base64 data is stored
3. **View in Admin Dashboard** - verify images display
4. **View in Customer Dashboard** - verify images display

## Rollback (If Needed)

To revert to file-based storage:
1. Restore `server/routers.ts` from git history
2. Uncomment AWS S3 config in `.env`
3. Restart application

## Notes

- ⚠️ Base64 encoding increases data size by ~33%
- ✅ Acceptable tradeoff for simplified architecture
- ✅ Database storage is cheaper than S3 for small-medium scale
- ✅ No CDN needed for ID verification (admin-only viewing)
