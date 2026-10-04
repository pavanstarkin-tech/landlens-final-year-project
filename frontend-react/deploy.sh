#!/bin/bash
# ====================================================================
# LandLens Frontend Production Deployment Script (AWS S3 + CloudFront)
# ====================================================================

set -e

echo "🚀 Starting LandLens Frontend Deployment Process..."

# 1. Ensure we are in the frontend directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 2. Build Production Bundle
echo "📦 Building production bundle using Vite..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Error: Output directory 'dist' was not generated."
  exit 1
fi

echo "✅ Production bundle built successfully inside dist/"

# 3. AWS Configuration
S3_BUCKET="landlens-portal-067103977319"
CLOUDFRONT_DIST_ID="E8845JKUZLQMQ"

# 4. Sync Immutable Assets to AWS S3 (Cache: 1 Year)
echo "☁️ Syncing static assets to S3 bucket (s3://$S3_BUCKET/assets/)..."
aws s3 sync dist/assets/ "s3://$S3_BUCKET/assets/" --delete --cache-control "public, max-age=31536000, immutable"

# 5. Sync Root HTML & Entry Files to AWS S3 (Cache: No Cache)
echo "📄 Syncing index.html and root files to S3 bucket (s3://$S3_BUCKET/)..."
aws s3 sync dist/ "s3://$S3_BUCKET/" --exclude "assets/*" --delete --cache-control "public, max-age=0, must-revalidate"

# 6. Invalidate CloudFront CDN Edge Cache
echo "🔄 Invalidating CloudFront CDN Edge Cache (Dist ID: $CLOUDFRONT_DIST_ID)..."
aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DIST_ID" --paths "/*" || true

echo "🎉 LandLens Frontend Deployed Successfully!"
echo "📍 Live URL: https://d2l0wwhwiyg7if.cloudfront.net"
echo "📍 S3 Direct: http://landlens-portal-067103977319.s3-website.ap-south-1.amazonaws.com"
