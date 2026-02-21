# Setup Instructions for Dashboard Configurations

This document contains step-by-step instructions for configurations that must be done through external dashboards (not via code).

---

## 1. Enable MFA in Clerk Dashboard

**Status**: ✅ Ready to Configure  
**Time**: 30 minutes  
**Cost**: $0 (included in all Clerk plans)

### Steps:

1. **Login to Clerk Dashboard**
   - Go to https://dashboard.clerk.com
   - Select your "Campus Connect" application

2. **Navigate to Multi-Factor Settings**
   - Click on **"User & Authentication"** in the left sidebar
   - Click on **"Multi-factor"**

3. **Enable Authenticator App (TOTP)**
   - Toggle **"Authenticator application"** to ON
   - This enables support for Google Authenticator, Authy, 1Password, etc.

4. **Enable SMS Verification (Optional)**
   - Toggle **"SMS code"** to ON
   - Note: SMS has additional costs (~$0.01 per SMS)
   - Recommended: Keep OFF for MVP, enable later if needed

5. **Configure MFA Strategy**
   - Select **"Optional"** (users can enable in their settings)
   - Do NOT select "Required" initially - this forces all users to set up MFA immediately

6. **Configure Backup Codes**
   - Enable **"Backup codes"** - allows users to save recovery codes
   - Recommended: Keep ON for account recovery

7. **Save Changes**
   - Click **"Save"** at the bottom of the page

### Verification:

After enabling, verify MFA is working:

1. **Test User Flow**:
   - Login to your app with a test account
   - Go to user settings/profile page
   - You should see "Enable Two-Factor Authentication" option
   - Click and follow the setup flow
   - Scan QR code with Google Authenticator
   - Enter 6-digit code to verify
   - Logout and login again - should prompt for 2FA code

2. **Check Clerk Dashboard**:
   - Go to **Users** tab
   - Click on your test user
   - Should see "Multi-factor" section with TOTP enabled

### Troubleshooting:

**Issue**: "Enable Two-Factor Authentication" not showing in app
- **Solution**: Clear browser cache and cookies, or use incognito mode
- **Solution**: Check Clerk is using latest SDK version in package.json

**Issue**: QR code not showing
- **Solution**: Ensure user is authenticated (check session)
- **Solution**: Check browser console for errors

### Documentation:
- Clerk MFA Docs: https://clerk.com/docs/custom-flows/multi-factor-authentication

---

## 4. Set Up Cloudflare WAF (Web Application Firewall)

**Status**: ✅ Ready to Configure  
**Time**: 2 hours  
**Cost**: $0 (Free tier sufficient for 10K users)

### Prerequisites:
- You must own a domain name (e.g., campusconnect.com)
- You must have access to domain registrar settings (Namecheap, GoDaddy, etc.)

### Part A: Sign Up and Add Domain

1. **Create Cloudflare Account**
   - Go to https://dash.cloudflare.com/sign-up
   - Sign up with your email
   - Verify email address

2. **Add Your Domain**
   - Click **"Add a Site"**
   - Enter your domain (e.g., `campusconnect.com`)
   - Click **"Add site"**

3. **Select Free Plan**
   - Choose **"Free"** plan
   - Click **"Continue"**

4. **Review DNS Records**
   - Cloudflare will scan your existing DNS records
   - Verify all records are imported correctly
   - Click **"Continue"**

### Part B: Update Nameservers

5. **Copy Cloudflare Nameservers**
   - Cloudflare will show 2 nameservers (e.g., `alina.ns.cloudflare.com`, `bob.ns.cloudflare.com`)
   - Copy these nameservers

6. **Update at Domain Registrar**
   - **If using Namecheap**:
     - Login to Namecheap → Domain List
     - Click **"Manage"** next to your domain
     - Under **"Nameservers"**, select **"Custom DNS"**
     - Paste the 2 Cloudflare nameservers
     - Click **"Save"**
   
   - **If using GoDaddy**:
     - Login to GoDaddy → My Products
     - Click **"DNS"** next to your domain
     - Scroll to **"Nameservers"** → Click **"Change"**
     - Select **"Custom"**
     - Enter the 2 Cloudflare nameservers
     - Click **"Save"**
   
   - **If using Google Domains**:
     - Login to domains.google.com
     - Click your domain → DNS
     - Under **"Name servers"**, select **"Use custom name servers"**
     - Enter Cloudflare nameservers
     - Click **"Save"**

7. **Wait for Propagation**
   - DNS propagation takes 2-24 hours (usually ~2 hours)
   - Cloudflare will email you when it's complete
   - You can check status at: https://www.whatsmydns.net

### Part C: Configure SSL/TLS

8. **Enable SSL**
   - In Cloudflare Dashboard → **SSL/TLS**
   - Select **"Full (strict)"** mode
   - This encrypts traffic between visitor → Cloudflare → your server

9. **Enable Always Use HTTPS**
   - Go to **SSL/TLS** → **Edge Certificates**
   - Toggle **"Always Use HTTPS"** to ON
   - This auto-redirects HTTP to HTTPS

### Part D: Configure Security Settings

10. **Set Security Level**
    - Go to **Security** → **Settings**
    - Set **"Security Level"** to **Medium**
    - This challenges visitors with a threat score > 14

11. **Enable DDoS Protection** (Automatic)
    - Free plan includes automatic DDoS protection
    - No configuration needed - always active

12. **Configure Browser Integrity Check**
    - In **Security** → **Settings**
    - Toggle **"Browser Integrity Check"** to ON
    - This blocks known malicious bots

### Part E: Create Firewall Rules

13. **Create WAF Rules**
    - Go to **Security** → **WAF**
    - Click **"Create firewall rule"**

**Rule 1: Block Known Bad Bots**
```
Rule name: Block Bad Bots
Field: Bot Score
Operator: less than
Value: 30
Action: Block
```

**Rule 2: Rate Limit API Routes**
```
Rule name: Rate Limit API
Field: URI Path
Operator: contains
Value: /api/
AND
Field: Threat Score
Operator: greater than
Value: 50
Action: Managed Challenge
```

**Rule 3: Protect Auth Endpoints**
```
Rule name: Protect Auth
Field: URI Path
Operator: equals
Value: /api/webhooks/clerk
AND
Field: Country
Operator: not in list
Value: US, CA, GB, EU countries
Action: Managed Challenge
```

**Rule 4: Block SQL Injection Attempts**
```
Rule name: Block SQLi
Field: URI Query String
Operator: contains
Value: union select
OR
Field: URI Query String
Operator: contains
Value: drop table
Action: Block
```

**Rule 5: Block XSS Attempts**
```
Rule name: Block XSS
Field: URI Query String
Operator: contains
Value: <script
Action: Block
```

14. **Enable Rate Limiting** (Free: 1 rule)
    - Go to **Security** → **WAF** → **Rate limiting rules**
    - Click **"Create rate limiting rule"**

```
Rule name: General Rate Limit
If incoming requests match: Custom filter expression
    Field: Hostname
    Operator: equals
    Value: your-domain.com
When rate exceeds: 100 requests per 1 minute
Then: Block for 10 minutes
```

### Part F: Configure Caching

15. **Set Caching Rules**
    - Go to **Caching** → **Configuration**
    - **Browser Cache TTL**: 4 hours (for static assets)
    - **Caching Level**: Standard

16. **Create Cache Rules**
    - Go to **Caching** → **Cache Rules**
    - Click **"Create rule"**

**Rule 1: Cache Static Assets**
```
Rule name: Cache Static
If incoming requests match:
    Field: URI Path
    Operator: matches regex
    Value: \.(jpg|jpeg|png|gif|webp|css|js|woff|woff2)$
Then:
    Cache status: Eligible for cache
    Edge TTL: 1 day
    Browser TTL: 4 hours
```

**Rule 2: Bypass Cache for API**
```
Rule name: Bypass API Cache
If incoming requests match:
    Field: URI Path
    Operator: starts with
    Value: /api/
Then:
    Cache status: Bypass cache
```

### Part G: Verify Configuration

17. **Test Cloudflare is Active**
    ```bash
    # In terminal, run:
    curl -I https://your-domain.com
    
    # Look for these headers:
    # cf-ray: xxxxxx (confirms Cloudflare is active)
    # cf-cache-status: HIT or MISS
    # server: cloudflare
    ```

18. **Test Firewall Rules**
    - Try accessing your site from different IPs
    - Try malicious URLs (e.g., `?union+select`)
    - Should see Cloudflare challenge page or block page

19. **Monitor Traffic**
    - Go to **Analytics** → **Security**
    - View blocked requests, challenges, etc.
    - Monitor over next 24 hours

### Part H: Connect to Vercel

20. **Add Domain to Vercel**
    - Go to Vercel Dashboard → Your Project
    - Click **"Settings"** → **"Domains"**
    - Add your custom domain (e.g., `campusconnect.com`)

21. **Configure DNS in Cloudflare**
    - Go to Cloudflare → **DNS** → **Records**
    - Add A record (if using apex domain):
      ```
      Type: A
      Name: @
      Content: 76.76.21.21 (Vercel IP)
      Proxy status: Proxied (orange cloud)
      ```
    
    - Or add CNAME record (if using subdomain):
      ```
      Type: CNAME
      Name: www
      Content: cname.vercel-dns.com
      Proxy status: Proxied (orange cloud)
      ```

22. **Verify Domain**
    - Back in Vercel, click **"Verify"**
    - Should see green checkmark
    - Visit your domain - should load your app through Cloudflare

### Troubleshooting:

**Issue**: Site not loading after changing nameservers
- **Solution**: Wait 2-24 hours for DNS propagation
- **Solution**: Check nameservers: `nslookup -type=ns your-domain.com`

**Issue**: "Too many redirects" error
- **Solution**: Set Cloudflare SSL to "Full (strict)" not "Flexible"
- **Solution**: Ensure Vercel has SSL certificate

**Issue**: API requests failing
- **Solution**: Check firewall rules aren't blocking legitimate traffic
- **Solution**: Temporarily set security level to "Low" for testing

**Issue**: Cloudflare not caching anything
- **Solution**: Clear Cloudflare cache: **Caching** → **Configuration** → **Purge Everything**
- **Solution**: Check cache rules are correctly configured

### Cost Breakdown:

- **Free Plan Includes**:
  - Unlimited DDoS protection
  - Universal SSL certificate
  - 5 firewall rules
  - 1 rate limiting rule
  - CDN with 200+ edge locations
  - Web Application Firewall (WAF)
  - Analytics

- **Paid Upgrades** (Optional):
  - Pro Plan: $20/month (adds 20 firewall rules, image optimization)
  - Business Plan: $200/month (adds advanced DDoS, 100 rules)

**Recommendation**: Free plan is sufficient for 0-10K users.

### Documentation:
- Cloudflare Docs: https://developers.cloudflare.com/
- Vercel + Cloudflare: https://vercel.com/guides/using-cloudflare-with-vercel

---

## Completion Checklist

- [ ] **MFA Enabled in Clerk**
  - [ ] Authenticator app enabled
  - [ ] Strategy set to "Optional"
  - [ ] Tested with user account
  
- [ ] **Cloudflare Configured**
  - [ ] Domain added to Cloudflare
  - [ ] Nameservers updated
  - [ ] SSL/TLS set to "Full (strict)"
  - [ ] 5 firewall rules created
  - [ ] Rate limiting enabled
  - [ ] Domain verified in Vercel
  - [ ] Site accessible via custom domain

---

**Next Steps**: After completing these dashboard configurations, proceed with code implementations (Tasks 2, 3, 5, 6, 7, etc.)
