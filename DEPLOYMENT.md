# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Vercel account
2. GitHub repository with your code
3. Environment variables configured

### Quick Deploy Steps

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Production optimizations and fixes"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and use optimal settings

3. **Configure Environment Variables:**
   In Vercel dashboard → Project Settings → Environment Variables, add:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ADOBE_PDF_SERVICES_CLIENT_ID=your_adobe_client_id
   ADOBE_PDF_SERVICES_CLIENT_SECRET=your_adobe_client_secret
   UPSTASH_REDIS_REST_URL=your_upstash_redis_url
   UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_ENVIRONMENT=your_pinecone_environment
   PINECONE_INDEX_NAME=your_pinecone_index_name
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Alternative: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Production Optimizations Applied

### Performance
- ✅ Bundle splitting for vendors and Radix UI
- ✅ CSS optimization enabled
- ✅ Package import optimization
- ✅ Image optimization with WebP/AVIF
- ✅ Compression enabled
- ✅ ETags for caching

### Security
- ✅ Security headers (X-Frame-Options, CSP, etc.)
- ✅ Powered-by header removed
- ✅ XSS protection enabled

### Bundle Analysis
- ✅ Webpack bundle analyzer configured
- ✅ Run `npm run build:analyze` to analyze bundle size

### Dependencies
- ✅ Removed problematic canvas dependency
- ✅ Fixed React types version conflicts
- ✅ Consistent npm package management

## Monitoring & Maintenance

### Build Analysis
```bash
npm run build:analyze
```

### Performance Monitoring
- Use Vercel Analytics
- Monitor Core Web Vitals
- Check bundle size regularly

### Environment Variables
- Keep `.env.example` updated
- Never commit actual secrets
- Use Vercel's environment variable management

## Troubleshooting

### Common Issues
1. **Build fails:** Check environment variables are set
2. **API routes timeout:** Increase function timeout in vercel.json
3. **Large bundle size:** Run bundle analyzer and optimize imports

### Support
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs