# Cloudflare R2 Setup Guide

## Quick Start

1. **Install dependencies** (already done):
   ```bash
   npm install
   ```

2. **Configure R2 credentials** - Choose one method:

### Method A: Environment Variables (Recommended)
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

### Method B: app.json Configuration
Add to `app.json` under `expo.extra`:
```json
{
  "expo": {
    "extra": {
      "R2_ACCOUNT_ID": "your_account_id",
      "R2_ACCESS_KEY_ID": "your_access_key_id", 
      "R2_SECRET_ACCESS_KEY": "your_secret_access_key",
      "R2_BUCKET_NAME": "your_bucket_name",
      "R2_REGION": "auto",
      "R2_ENDPOINT": "https://your_account_id.r2.cloudflarestorage.com"
    }
  }
}
```

## Getting R2 Credentials

1. **Account ID**: Found in Cloudflare dashboard sidebar
2. **API Token**: 
   - Go to Cloudflare dashboard → R2 → Manage R2 API tokens
   - Create token with "Edit" permissions for your bucket
3. **Bucket**: Create a bucket in R2 dashboard
4. **Endpoint**: Usually `https://<account_id>.r2.cloudflarestorage.com`

## How It Works

- Navigate to **Files** screen in the app
- Tap **Upload** button
- Select images/videos from your device
- Files are uploaded to your R2 bucket
- Uploaded files appear in the list with name and size

## Features

- ✅ Upload images and videos to R2
- ✅ Multiple file selection
- ✅ Progress feedback during upload
- ✅ File type detection and icons
- ✅ Search and filter uploaded files
- ✅ Error handling with user feedback

## Next Steps (Optional)

- Add image thumbnails/previews
- Implement file deletion
- Add signed URLs for private buckets
- Create R2 config test screen