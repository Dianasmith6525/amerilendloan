# ID Verification System Guide

## Overview
The ID verification system allows customers to upload government-issued ID documents and selfies during the loan application process. Admins can review and approve/reject these documents from the admin dashboard.

## Features

### Customer Experience
1. **Document Upload** (in Apply Loan page)
   - Upload front of government-issued ID (Driver's License, Passport, etc.)
   - Upload back of ID
   - Upload selfie photo holding the ID
   - Supports: JPG, PNG, GIF, PDF formats
   - Real-time preview before submission

2. **Document Viewing** (in Customer Dashboard)
   - View uploaded documents
   - Download copies
   - Check verification status: Pending, Verified, or Rejected

### Admin Experience
1. **ID Verification Tab** (in Admin Dashboard)
   - View all applications with ID documents
   - See ID front, back, and selfie images side-by-side
   - Review verification status badges
   - Approve or reject ID verification
   - Add admin notes/reasons

2. **Actions Available**
   - ✅ **Approve ID** - Mark documents as verified
   - ❌ **Reject ID** - Reject with required reason
   - 📝 **Add Notes** - Optional notes when approving
   - 🔍 **View Full Size** - Click images to view larger
   - ⬇️ **Download** - Download documents locally

## File Storage

### Local Storage (Default)
When AWS S3 credentials are NOT configured:
- Files are stored locally in the `uploads/` folder
- Folder structure: `uploads/id_proof/user-{userId}/{filename}`
- Files are returned as base64 data URLs
- **Note**: Not recommended for production (files not backed up)

### AWS S3 Storage (Production)
When AWS S3 credentials ARE configured in `.env`:
- Files are uploaded to S3 bucket
- Presigned URLs generated for secure access
- Automatic expiration after 1 hour
- Professional, scalable solution

## Configuration

### Enable AWS S3 (Recommended for Production)
```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=amerilend-documents
```

### Using Local Storage (Development/Testing)
Simply leave AWS credentials commented out - the system will automatically use local storage.

## API Endpoints

### Customer Endpoints
- **POST** `/api/trpc/loans.apply` - Submit loan application with ID images (base64)
- **GET** `/api/trpc/loans.myApplications` - Get user's applications with ID URLs

### Admin Endpoints
- **GET** `/api/trpc/loans.adminList` - Get all applications (includes ID data)
- **POST** `/api/trpc/loans.adminApproveIdVerification` - Approve ID verification
  ```typescript
  { id: number, notes?: string }
  ```
- **POST** `/api/trpc/loans.adminRejectIdVerification` - Reject ID verification
  ```typescript
  { id: number, reason: string }
  ```
- **GET** `/api/trpc/files.getDownloadUrl` - Get download URL for S3 key
  ```typescript
  { s3Key: string }
  ```

## Database Schema

### Loan Applications Table
```sql
idFrontUrl: text           -- S3 key or local path to front of ID
idBackUrl: text            -- S3 key or local path to back of ID
selfieUrl: text            -- S3 key or local path to selfie
idVerificationStatus: enum -- 'pending' | 'verified' | 'rejected'
idVerificationNotes: text  -- Admin notes on verification
```

## Workflow

### 1. Customer Applies for Loan
```
Customer → Apply Loan Page → Upload 3 Documents → Submit Application
                               ↓
                           Convert to Base64
                               ↓
                       Send to Backend API
                               ↓
                    Save to S3 or Local Storage
                               ↓
                  Store S3 Key/Path in Database
                               ↓
              Set idVerificationStatus = 'pending'
```

### 2. Admin Reviews Documents
```
Admin → Admin Dashboard → ID Verification Tab → View Documents
                               ↓
                       Approve or Reject
                               ↓
                Update idVerificationStatus
                               ↓
                    Add Admin Notes
                               ↓
              (Optional) Send Email to Customer
```

### 3. Customer Checks Status
```
Customer → Dashboard → View Application → See Verification Status
                               ↓
              Status Badge: Pending/Verified/Rejected
                               ↓
              (If Rejected) View Admin Reason
```

## Security Features

1. **Admin-Only Access**
   - Only admins can approve/reject verifications
   - Only admins can view ID verification tab
   - Protected by `adminProcedure` middleware

2. **File Validation**
   - Max file size: 10MB per file
   - Allowed types: PDF, JPG, PNG, GIF, DOC, DOCX
   - File extension validation
   - MIME type verification

3. **Secure URLs**
   - S3 presigned URLs expire after 1 hour
   - Local files converted to base64 (no direct file access)
   - No public file listings

## Troubleshooting

### Files Not Displaying in Admin Dashboard
**Cause**: AWS credentials not configured, but code expects S3
**Solution**: System now automatically uses local storage fallback

### Upload Fails
**Check**:
1. File size < 10MB
2. File type is allowed (JPG, PNG, GIF, PDF)
3. `uploads/` folder exists and is writable (for local storage)
4. AWS credentials valid (for S3 storage)

### Cannot Download Files
**Check**:
1. S3 key exists in database
2. File exists in `uploads/` folder (local) or S3 bucket
3. Admin is logged in (required for download endpoint)

## Production Checklist

- [ ] Configure AWS S3 credentials in `.env`
- [ ] Create S3 bucket with proper permissions
- [ ] Set up S3 bucket CORS policy
- [ ] Enable S3 encryption at rest
- [ ] Configure S3 lifecycle policies
- [ ] Set up CloudFront CDN (optional)
- [ ] Test file uploads and downloads
- [ ] Verify admin can see all documents
- [ ] Test approval/rejection workflow
- [ ] Backup `uploads/` folder before migration (if using local storage)

## Development Notes

### Local Storage Path
- Location: `{project_root}/uploads/`
- Structure: `uploads/id_proof/user-{userId}/{filename}`
- Automatically created on first upload
- Ignored by git (in `.gitignore`)

### Migration from Local to S3
If migrating from local storage to S3:
1. Enable AWS credentials in `.env`
2. Restart application
3. New uploads will go to S3
4. Existing local files remain accessible
5. (Optional) Migrate old files to S3 using custom script

## Support

For questions or issues:
- Check logs: `server/_core/logging.ts`
- Review file upload code: `server/_core/fileUpload.ts`
- Check admin UI: `client/src/pages/AdminDashboard.tsx`
- Review routers: `server/routers.ts`
