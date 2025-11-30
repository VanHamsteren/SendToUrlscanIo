# Mozilla Add-ons Submission Checklist

## Pre-Submission Testing

### Functionality Tests
- [ ] Extension loads in Firefox without errors
- [ ] Settings page opens correctly
- [ ] API key field accepts input and toggles visibility
- [ ] Visibility dropdown works (Public/Unlisted/Private)
- [ ] Tags field accepts comma-separated values
- [ ] Save button saves settings successfully
- [ ] Reset button restores defaults (except API key)
- [ ] Settings persist after browser restart
- [ ] Context menu appears on right-click over links
- [ ] URL scanning submits to urlscan.io
- [ ] Success notification appears after submission
- [ ] Error notification appears for invalid API key
- [ ] Results page opens automatically after scan completes
- [ ] Polling works correctly (10s delay + 2s intervals)
- [ ] Timeout handling works (stops after 40s)

### UI/UX Tests
- [ ] All text is readable and properly formatted
- [ ] No typos in UI text
- [ ] Color scheme is consistent
- [ ] Buttons have hover effects
- [ ] Form validation shows appropriate errors
- [ ] Status messages appear and auto-hide
- [ ] Loading spinner appears during save
- [ ] Input fields have proper focus states
- [ ] Links in footer open correctly
- [ ] Icons display correctly (16px, 32px, 256px)

### Code Quality
- [ ] No console errors in browser console
- [ ] No console errors in background script
- [ ] ESLint validation passes
- [ ] No JavaScript errors during runtime
- [ ] All files use consistent formatting
- [ ] Comments are clear and helpful
- [ ] No debug code left in production

### Browser Compatibility
- [ ] Tested on Firefox 109+
- [ ] Tested on Firefox 115 ESR
- [ ] Tested on latest Firefox stable
- [ ] Works on Windows
- [ ] Works on macOS
- [ ] Works on Linux

---

## Package Preparation

### Files to Include
- [ ] `manifest.json` (Manifest V3)
- [ ] `background.js`
- [ ] `options.html`
- [ ] `options.js`
- [ ] `icons/urlscan_16.png`
- [ ] `icons/urlscan_32.png`
- [ ] `icons/urlscan_256.png`

### Files to Exclude
- [ ] Remove `README.md` (or include for reviewers)
- [ ] Remove `IMPROVEMENTS.md`
- [ ] Remove `DESIGN.md`
- [ ] Remove `.git` folder (if present)
- [ ] Remove `.gitignore` (if present)
- [ ] Remove any test files
- [ ] Remove any build artifacts

### Create Package
```bash
cd /app
zip -r urlscan-extension-v1.1.0.zip manifest.json background.js options.html options.js icons/ -x "*.DS_Store" "*.md" ".git/*"
```

---

## Mozilla Developer Hub Submission

### Account Setup
- [ ] Create Mozilla Add-ons account at https://addons.mozilla.org/
- [ ] Verify email address
- [ ] Set up developer profile

### Extension Details

#### Basic Information
- **Name**: Verify link with urlscan.io
- **Summary**: Right-click hyperlinks to send them to urlscan.io and view the results. Professional security analysis at your fingertips.
- **Description**: 
```
This extension integrates urlscan.io's powerful security scanning directly into Firefox. Simply right-click any link to submit it for analysis and automatically view the detailed results.

Features:
• Right-click context menu for instant URL scanning
• Customizable scan visibility (Public/Unlisted/Private)
• Custom tagging for organization
• Automatic result opening when scan completes
• Secure local storage of API credentials
• Clean, professional interface

Requirements:
• Free urlscan.io account (https://urlscan.io/user/signup)
• API key (https://urlscan.io/user/profile/)

Privacy:
Your API key is stored locally in Firefox's secure storage and is never shared with any third party except urlscan.io for legitimate scanning requests.
```

#### Categories
- [ ] Security & Privacy
- [ ] Web Development (optional)

#### Tags
- [ ] security
- [ ] urlscan
- [ ] url-scanner
- [ ] phishing
- [ ] malware
- [ ] website-security

#### Support Information
- **Support Email**: info@paulrutten.nl
- **Support Website**: (if available)
- **Homepage**: (if available)

### Version Information
- **Version Number**: 1.1.0
- **Version Notes**:
```
Major update with Manifest V3 migration and professional UI redesign.

New Features:
- Customizable tags for organizing scans
- Modern, professional UI matching urlscan.io branding
- API key show/hide toggle for security
- Real-time input validation
- Reset to defaults option

Improvements:
- Upgraded to Manifest V3 for future compatibility
- Fixed polling delay bug
- Enhanced error handling and user feedback
- Better mobile responsiveness
- Comprehensive JSDoc documentation

Bug Fixes:
- Fixed scan result polling delay
- Fixed HTML entity error in options page
```

### Technical Details

#### Minimum Firefox Version
- [ ] Set to: **109.0** (first version with full Manifest V3 support)

#### Permissions Justification
Prepare explanations for each permission:

1. **contextMenus**
   - *Reason*: To add "Scan with urlscan.io" option to the right-click menu on links

2. **activeTab**
   - *Reason*: To access the URL of the link the user right-clicked on

3. **tabs**
   - *Reason*: To open the scan results page in a new tab automatically

4. **storage**
   - *Reason*: To securely store user's API key, visibility preference, and custom tags locally

5. **notifications**
   - *Reason*: To display scan status updates (success/error messages) to the user

6. **host_permissions: https://urlscan.io/***
   - *Reason*: To communicate with the urlscan.io API for submitting scans and retrieving results

### Privacy Policy

Provide clear privacy statement:

```
Privacy Policy for URLScan.io Extension

Data Collection:
This extension does NOT collect, transmit, or share any personal data except as necessary for its core functionality.

Data Storage:
• Your urlscan.io API key is stored locally in Firefox's secure sync storage
• Scan visibility preferences are stored locally
• Custom tags are stored locally
• No data is transmitted to any third party except urlscan.io

Data Transmission:
• URLs you choose to scan are sent to urlscan.io's API
• Your API key is included in requests to urlscan.io for authentication
• No other data is transmitted

Third-Party Services:
This extension uses urlscan.io's public API. Please refer to urlscan.io's privacy policy and terms of service:
https://urlscan.io/about/

Contact:
For privacy concerns, contact: info@paulrutten.nl
```

---

## Screenshots

### Required Screenshots (Minimum 2, Maximum 10)

#### Screenshot 1: Settings Page
- Show the main options page with all fields
- Ensure professional appearance
- Capture at 1280x800 or similar
- **Caption**: "Easy configuration with secure API key storage and customizable options"

#### Screenshot 2: Context Menu
- Show right-click menu on a link
- Highlight the "Scan with urlscan.io" option
- **Caption**: "Right-click any link to scan with urlscan.io"

#### Screenshot 3 (Optional): Notification
- Show success notification after scan
- **Caption**: "Real-time notifications keep you informed of scan progress"

#### Screenshot 4 (Optional): Validation
- Show form validation with helpful error messages
- **Caption**: "Smart validation ensures proper configuration"

#### Screenshot 5 (Optional): Tags Feature
- Highlight the custom tags field
- **Caption**: "Organize your scans with custom tags"

### Screenshot Tips
- Use Firefox's native screenshot tool (Shift+F2, then type "screenshot --fullpage")
- Ensure high resolution (at least 1280px wide)
- Use light mode for better visibility
- Show real data, not lorem ipsum
- Avoid sensitive information

---

## Source Code Submission

### If Asked for Source Code
Mozilla may request your source code for review:

- [ ] All JavaScript is unminified and readable
- [ ] No obfuscation used
- [ ] Include README.md with build instructions (if applicable)
- [ ] All dependencies documented
- [ ] No proprietary or licensed code without permission

For this extension:
```
No build process required. All files are source files.
Simply load the extension folder directly into Firefox.
```

---

## Review Process

### What Mozilla Reviewers Check
- Code quality and security
- Privacy compliance
- Permission usage justification
- User experience
- Performance
- Manifest compliance
- Description accuracy

### Common Rejection Reasons to Avoid
- ✅ Excessive permissions (we only use what's needed)
- ✅ Unclear privacy policy (we have a clear policy)
- ✅ Obfuscated code (all code is readable)
- ✅ Misleading description (our description is accurate)
- ✅ Poor user experience (professional UI implemented)
- ✅ Missing features from description (all features implemented)

### Response Time
- Initial review: 1-3 weeks typically
- Updates: Usually faster (1-5 days)
- Can be expedited if critical bug fix

---

## Post-Submission

### Monitor Review Status
- [ ] Check AMO dashboard regularly
- [ ] Respond promptly to reviewer questions
- [ ] Be prepared to make requested changes

### If Approved
- [ ] Extension will be published automatically
- [ ] Will appear in search results within 24 hours
- [ ] Announce on social media (optional)
- [ ] Add "Get Firefox Extension" badge to websites (optional)

### If Changes Requested
- [ ] Read reviewer comments carefully
- [ ] Make all requested changes
- [ ] Test thoroughly again
- [ ] Resubmit with detailed changelog
- [ ] Respond to reviewer comments

---

## Marketing (Optional)

### Promotion Ideas
- [ ] Share on developer social media
- [ ] Post on Reddit (r/firefox, r/netsec)
- [ ] Write blog post about development
- [ ] Submit to extension directories
- [ ] Share with security communities

### Mozilla Add-ons Assets
After approval, you can access:
- Add-on badge images
- Install button code
- Direct installation link
- Statistics dashboard
- User reviews

---

## Maintenance Plan

### Regular Updates
- [ ] Monitor Firefox updates for breaking changes
- [ ] Update to new Web Extension APIs as needed
- [ ] Fix reported bugs promptly
- [ ] Consider user feature requests
- [ ] Keep dependencies updated (if any)

### User Support
- [ ] Monitor user reviews on AMO
- [ ] Respond to questions
- [ ] Maintain support email
- [ ] Update documentation as needed

### Version Updates
When updating:
1. Increment version number (semantic versioning)
2. Update manifest.json
3. Write clear changelog
4. Test thoroughly
5. Submit update to AMO
6. Update README.md

---

## Final Checks Before Submission

- [ ] Version number is correct (1.1.0)
- [ ] All files are included in package
- [ ] Extension works perfectly in testing
- [ ] No console errors
- [ ] All descriptions are proofread
- [ ] Screenshots are high quality
- [ ] Privacy policy is clear
- [ ] Support email is correct
- [ ] All links work
- [ ] Package is properly zipped
- [ ] Ready to submit!

---

## Submission URL

https://addons.mozilla.org/en-US/developers/addon/submit/distribution

Good luck with your submission! 🚀
