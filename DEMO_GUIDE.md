# GuardR[AI]ls - Step-by-Step Demonstration Guide

This guide provides a complete walkthrough for demonstrating GuardR[AI]ls and its Auth0 security features.

---

## Pre-Demo Setup

### Before You Start

1. **Servers Running**:
   - Backend: `cd backend && npm run dev` (http://localhost:3001)
   - Frontend: `cd frontend && npm run dev` (http://localhost:5173)

2. **Auth0 Configuration**:
   - FGA tuples configured (user can only see payroll:EMP006)
   - Google social connection enabled
   - User logged in WITH Google on another device/browser (to get fresh tokens)

3. **Browser Setup**:
   - Open http://localhost:5173
   - Clear localStorage/cookies for clean demo
   - Have Auth0 Guardian app ready on mobile (if using real CIBA)

4. **Initial State**:
   - User NOT logged in
   - All toggles should be OFF (FGA, Vault, Async)

---

## Part 1: The Unauthenticated Experience

### Goal: Show limitations without authentication

### Step 1.1: Ask About Payroll (Unauthenticated)

**Action**: Type in chat:
```
show me the 2024 payroll
```

**Expected Response**:
```
I cannot perform this operation because you're not logged in.
Please log in to access treasury management features.
```

**Key Points**:
- ❌ Cannot access sensitive data without authentication
- Shows login prompt message

---

### Step 1.2: Ask About Transfers (Unauthenticated)

**Action**: Type:
```
Transfer $50,000 to account ACC789
```

**Expected Response**:
```
I cannot perform this operation because you're not logged in.
Please log in to execute transfers.
```

**Key Points**:
- ❌ Cannot execute financial operations
- Authentication is the first line of defense

---

### Step 1.3: "Who Am I?" (Unauthenticated)

**Action**: Type:
```
Who am I?
```

**Expected Response**:
```
You are currently browsing as an unauthenticated guest user.
You don't have a user profile or identity in the system.
To access personalized features, please log in.
```

**Key Points**:
- Shows the value of authentication
- Sets up the login flow
- **Special UI**: Message appears with login prompt component

---

### Step 1.4: Log In

**Action**: Click **"Login"** button in top right corner

**Expected Flow**:
1. Redirects to Auth0 Universal Login
2. User logs in (with Google recommended for Token Vault demo)
3. Redirects back to application
4. User profile appears in header

**Key Points**:
- ✅ Now authenticated
- User profile picture and email visible
- Security toggles now appear (FGA, Vault, Async)

---

## Part 2: Post-Login Identity Verification

### Step 2.1: "Who Am I?" (Authenticated)

**Action**: Type again:
```
Who am I?
```

**Expected Response**: User profile card showing:
```
👤 You are: [User Name]
📧 Email: user@example.com
🆔 User ID: auth0|xxx
🔐 Authentication Method: google-oauth2
✅ Verified: true
```

**Key Points**:
- ✅ Full identity context now available
- **Special UI**: Styled user profile card with visual formatting
- Shows authentication method and verification status

---

## Part 3: FGA for RAG - Document Filtering Demo

### Goal: Show how FGA filters documents based on permissions

### Step 3.1: Payroll WITHOUT FGA (Unsecured)

**Setup**: Ensure **FGA toggle is OFF**

**Action**: Type:
```
show me the 2024 payroll
```

**Expected Response**: Returns ALL 6 employees:
```
📊 2024 Payroll Summary

Here are all the payroll records:

1. 👤 John Smith (EMP001) - Engineering - $95,000
2. 👤 Sarah Johnson (EMP002) - Finance - $88,000
3. 👤 Michael Chen (EMP003) - Sales - $78,000
4. 👤 Emily Rodriguez (EMP004) - Marketing - $82,000
5. 👤 David Kim (EMP005) - Operations - $75,000
6. 👤 Lisa Wang (EMP006) - HR - $90,000

Total: 6 employees
```

**What Happens**:
- ⚠️ **NO permission check**
- All payroll data returned regardless of user access rights
- Potential data leak - user sees records they shouldn't

**Visualization**:
- "How It Works" modal appears automatically
- **Sequence Diagram**: Shows direct Vector DB → LLM flow (no FGA check)
- **Architecture Diagram**: Highlights missing security layer
- **Red indicators**: Show security risks

**Demo Notes**:
- Point out: "Notice ALL 6 employees are returned"
- Emphasize: "No permission filtering - major security risk"
- Show the diagram: "This is what happened under the hood"

---

### Step 3.2: Enable FGA Protection

**Action**: Click **FGA toggle** in header to turn it **ON**

**Visual Feedback**:
- Toggle switches from gray to blue
- Shield icon lights up in primary color

---

### Step 3.3: Payroll WITH FGA (Secured)

**Action**: Type the same query:
```
show me the 2024 payroll
```

**Expected Response**: Returns ONLY 1 employee:
```
📊 2024 Payroll Summary (Filtered by FGA)

Based on your permissions, here are the payroll records you can access:

1. 👤 Lisa Wang (EMP006) - HR - $90,000

Total: 1 employee (5 records filtered by Auth0 FGA)

🔒 Your access is controlled by Auth0 Fine-Grained Authorization
```

**What Happens**:
- ✅ **FGA permission check** before returning data
- Backend checks: `user:auth0|xxx viewer payroll:EMP001` through `EMP006`
- Only EMP006 returns `allowed: true`
- Other 5 records filtered out

**Backend Logs Show**:
```
[FGA] Checking payroll access permissions...
[FGA Check] user:auth0|xxx viewer payroll:EMP001 = false
[FGA Check] user:auth0|xxx viewer payroll:EMP002 = false
[FGA Check] user:auth0|xxx viewer payroll:EMP003 = false
[FGA Check] user:auth0|xxx viewer payroll:EMP004 = false
[FGA Check] user:auth0|xxx viewer payroll:EMP005 = false
[FGA Check] user:auth0|xxx viewer payroll:EMP006 = true
[FGA] User can access 1/6 records
```

**Visualization**:
- "How It Works" modal appears
- **Sequence Diagram**: Shows FGA filtering loop before LLM
- **Architecture Diagram**: Highlights Auth0 FGA security layer
- **FGA Visualizer (NEW)**: Shows relationship graph
  - User → Role → Payroll Group → viewer → ALLOWED for EMP006
  - Dashed lines show missing relationships for others
- **Green indicators**: Show secure data flow

**Demo Notes**:
- Point out: "Now only 1 employee - the one I have permission for"
- Show backend logs: "FGA checked all 6, only allowed 1"
- Click through all 3 tabs in the diagram modal
- Emphasize: "FGA Visualizer shows WHY access was granted"

---

## Part 4: Token Vault - Secure OAuth Token Storage

### Goal: Show secure OAuth token management

### Step 4.1: Calendar WITHOUT Token Vault (Disabled)

**Setup**: Ensure **Vault toggle is OFF**

**Action**: Type:
```
show me my calendar
```

**Expected Response**:
```
🔒 Token Vault is currently disabled. To view your Google Calendar:

1. Enable "Token Vault" in Settings (toggle in header)
2. This will securely store your OAuth tokens with Auth0
3. Then try your request again

Without Token Vault, OAuth tokens would be stored insecurely in the application database - a significant security risk.
```

**Key Points**:
- ❌ Operation blocked when Vault is OFF
- Agent explains why it's important
- Educational moment about token security

---

### Step 4.2: Enable Token Vault

**Action**: Click **Vault toggle** in header to turn it **ON**

**Visual Feedback**:
- Toggle switches from gray to blue
- Vault icon lights up

---

### Step 4.3: Calendar WITH Token Vault (But Not Connected)

**Action**: Type again:
```
show me my calendar
```

**Expected Response**:
```
🔗 Google Calendar is not connected to your account.

To access your calendar:
1. Click the "Connect Google Calendar" button below
2. Authorize GuardR[AI]ls to access your calendar
3. Your tokens will be securely stored in Auth0 Token Vault

[Connect Google Calendar Button appears]
```

**Key Points**:
- Vault is enabled but user hasn't connected yet
- **Special UI**: Blue "Connect Google Calendar" button appears

---

### Step 4.4: Connect Google Calendar

**Action**: Click **"Connect Google Calendar"** button

**Expected Flow**:
1. **Popup opens**: Auth0 login with Google OAuth consent screen
2. **User consents**: Grants calendar.readonly permission
3. **Popup shows success**: "Successfully connected your Google account!"
4. **Popup closes automatically** (no page refresh)
5. **Calendar events appear** automatically in chat:

```
Great! Your Google Calendar is now connected. Here are your upcoming events:

📅 Team Standup
⏰ Mon, Feb 17 at 10:00 AM - 10:30 AM
📍 Conference Room B
👥 sarah.johnson@company.com, mike.chen@company.com

📅 Q2 Budget Review
⏰ Wed, Feb 19 at 2:00 PM - 3:00 PM
📍 Executive Board Room
👥 cfo@company.com, finance-team@company.com

📅 Soccer Practice
⏰ Thu, Feb 20 at 5:30 PM - 6:30 PM
📍 Riverside Soccer Fields
👥 coach@soccerleague.org
```

**What Happens Behind the Scenes**:
1. `getAccessTokenWithPopup()` opens Google OAuth
2. Auth0 stores tokens in Connected Accounts (Token Vault)
3. Frontend sets `localStorage.setItem('googleConnected', 'true')`
4. Mock calendar events displayed (since real API not connected)

**Visualization**:
- "How It Works" modal appears
- **Sequence Diagram**: Shows token storage in Auth0 Vault with encryption
- **Architecture Diagram**: Shows Auth0 managing token lifecycle
- **Green indicators**: Secure token storage

**Demo Notes**:
- Emphasize: "No page refresh - smooth UX"
- Point out: "Tokens stored in Auth0, not our database"
- Show diagram: "This is how Token Vault protected the OAuth tokens"
- Click between Sequence and Architecture tabs

---

### Step 4.5: Compare Vault OFF vs ON

**Action**: Toggle Vault OFF, type:
```
show me my calendar
```

**Expected**: Gets blocked again (even though connected)

**Action**: Toggle Vault back ON, type:
```
show my calendar
```

**Expected**: Calendar events display immediately (from mock data)

**Key Point**: Toggle controls whether the feature is active, demonstrating the security difference

---

## Part 5: CIBA - Async Authorization for High-Risk Operations

### Goal: Show out-of-band approval for sensitive operations

### Step 5.1: Transfer WITHOUT CIBA (Unsecured)

**Setup**: Ensure **Async toggle is OFF**

**Action**: Type:
```
Transfer $50,000 to account ACC789
```

**Expected Response** (immediate):
```
💸 Transfer Executed

Transfer Details:
• Amount: $50,000
• From: ACC001 (Primary Treasury)
• To: ACC789
• Status: ✅ Completed
• Transaction ID: TXN-xxx
• Timestamp: [current time]

The transfer has been processed successfully.
```

**What Happens**:
- ⚠️ **Immediate execution** - no approval required
- Dangerous: Session hijacking or AI misinterpretation could cause unauthorized transfers
- No second-factor verification

**Visualization** (appears 2 seconds after response):
- "How It Works" modal appears
- **Sequence Diagram**: Shows direct User → Agent → Backend → Complete (no approval step)
- **Architecture Diagram**: Highlights missing CIBA layer with security risks
- **Red indicators**: Show immediate execution risks

**Demo Notes**:
- Point out: "Transfer executed immediately - no approval"
- Emphasize: "What if session was hijacked? What if AI misunderstood?"
- Show diagram: "No human in the loop - dangerous for high-value operations"

---

### Step 5.2: Enable CIBA (Async Auth)

**Action**: Click **Async toggle** in header to turn it **ON**

**Visual Feedback**:
- Toggle switches from gray to blue
- UserCheck icon lights up

---

### Step 5.3: Transfer WITH CIBA (Secured)

**Action**: Type:
```
Transfer $50,000 to account ACC999
```

**Expected Response** (multi-stage):

**Stage 1 - Immediate Response**:
```
🔐 Async Authorization Required

High-risk operation detected: Transfer of $50,000 to ACC999

For your security, this operation requires out-of-band approval:
1. Check your Auth0 Guardian mobile app
2. Review the transfer details
3. Approve or deny the request

⏳ I'll wait up to 2 minutes for your response...
```

**What Happens Next**:
- **Backend creates CIBA request** with auth_req_id
- **Simulated approval**: After 5 seconds, auto-approves (or use real Guardian app)
- **Backend polls** for approval status every 5 seconds
- **Agent waits** (blocking) for up to 2 minutes

**Stage 2 - After Approval** (5-10 seconds later):

The initial message **updates** to show:
```
🔐 Async Authorization Required

High-risk operation detected: Transfer of $50,000 to ACC999

For your security, this operation requires out-of-band approval:
1. Check your Auth0 Guardian mobile app
2. Review the transfer details
3. Approve or deny the request

⏳ I'll wait up to 2 minutes for your response...

✅ APPROVED & EXECUTED

Transfer of $50,000 to ACC999 completed successfully.
Transaction ID: TXN-xxx
```

**Backend Logs Show**:
```
[AsyncAuth] CIBA request created: auth_req_xxx
[AsyncAuth] Waiting for approval (max 120s)...
[AsyncAuth] Simulated auto-approval after 5s
[AsyncAuth] Request approved
[Transfer] Executing transfer after CIBA approval
```

**Visualization** (appears 2 seconds after completion):
- "How It Works" modal appears
- **Sequence Diagram**: Shows complete CIBA flow:
  1. User → Agent → Auth0 CIBA (initiate)
  2. Auth0 → Guardian Mobile (push notification)
  3. User reviews on mobile → Approves
  4. Auth0 → Agent (polling, approved)
  5. Agent → Backend (execute)
- **Architecture Diagram**: Shows mobile approval layer
- **Green/Yellow indicators**: Secure approval flow with user verification

**Demo Notes**:
- Point out: "Notice the wait - requires human approval"
- Emphasize: "User explicitly reviewed '$50,000 to ACC999' on mobile"
- If using real CIBA: Show the Guardian app notification
- Show diagram: "This is the out-of-band approval flow"
- Highlight: "Even if session hijacked, attacker can't transfer without your mobile device"

---

### Step 5.4: Compare CIBA OFF vs ON

**Action**: Toggle Async OFF, transfer again:
```
Transfer $25,000 to ACC555
```

**Expected**: Executes immediately (under $50K still triggers async if enabled)

**Action**: Toggle Async back ON, try same transfer

**Expected**: Requires approval flow again

**Key Point**: Demonstrates the security difference with toggle comparison

---

## Complete Demonstration Flow Summary

### Timeline (15-20 minutes)

| Time | Section | Key Message |
|------|---------|-------------|
| 0:00 | Unauthenticated | "Without auth, AI agent is locked down" |
| 2:00 | Who Am I? | "Identity context is essential" |
| 3:00 | Login | "Auth0 provides secure authentication" |
| 4:00 | FGA Demo | "Permission filtering prevents data leaks" |
| 8:00 | Token Vault Demo | "Secure OAuth token management" |
| 12:00 | CIBA Demo | "Out-of-band approval for high-risk ops" |
| 18:00 | Q&A | Questions and deep dives |

---

## Demo Script with Talking Points

### Opening (2 minutes)

**Say**:
> "Today I'll show you GuardR[AI]ls - an AI agent for treasury management. More importantly, I'll demonstrate three Auth0 security features that transform an unsecured AI agent into a production-ready, compliant system: FGA for data access control, Token Vault for OAuth security, and CIBA for high-risk operation approval."

> "The unique thing about this demo is that you'll SEE the security in action through interactive diagrams. After each operation, you'll see exactly how Auth0 protected - or didn't protect - the data."

### Part 1: Without Auth (2 minutes)

**Say**:
> "Let's start unauthenticated. Watch what happens when I try to access sensitive data..."

[Ask for payroll - gets denied]

> "Good - authentication is our first line of defense. But authentication alone isn't enough for AI agents. Let me log in and show you why."

[Login flow]

### Part 2: FGA Demo (5 minutes)

**Say**:
> "Now I'm authenticated, but watch what happens with FGA turned OFF..."

[Query payroll - gets all 6 records]

> "I got ALL 6 employee records. In a real scenario with thousands of records, this AI agent just leaked data I shouldn't have access to. This is the RAG security problem - you can't just authenticate, you need fine-grained authorization."

[Show unsecured diagram]

> "This diagram shows what just happened - no permission check between the database and the AI."

[Enable FGA]

> "Now let's enable Auth0 FGA and try the same request..."

[Query payroll again - gets 1 record]

> "Notice - only 1 record this time. FGA checked my permissions against all 6 records and filtered out the 5 I'm not allowed to see."

[Show secured diagram with 3 tabs]

> "The sequence diagram shows FGA's filtering loop. The architecture shows where FGA sits in the pipeline. And this FGA Visualizer - this is unique - shows the actual relationship graph. I'm a member of a specific payroll group that grants me viewer access to only EMP006's record."

**Backend log callout**:
> "And if you look at the backend logs, you can see each individual FGA check - 5 denied, 1 allowed."

### Part 3: Token Vault Demo (5 minutes)

**Say**:
> "Next is Token Vault for OAuth tokens. With Vault OFF, let me try to access my calendar..."

[Ask for calendar - gets blocked]

> "Blocked - but notice it's not an authentication issue. The agent is explaining why Token Vault is important."

[Enable Vault toggle]

> "With Vault enabled, I'll try again..."

[Ask for calendar - shows connect button]

> "Now I need to connect my Google account. Watch what happens..."

[Click connect button]

> "This opens Auth0's OAuth flow. I consent to calendar access, and Auth0 stores the tokens securely in Token Vault - not in my application database."

[Wait for popup to complete and calendar events to appear]

> "Notice - no page refresh. The OAuth tokens are now in Auth0's encrypted Token Vault, and I can see my calendar events."

[Show diagram]

> "This diagram shows the secure token exchange. Instead of storing tokens alongside my app data where a database breach would expose them, they're in Auth0's isolated, encrypted vault with audit logging."

### Part 4: CIBA Demo (5 minutes)

**Say**:
> "Finally, let's look at high-risk operations. With Async Auth OFF, watch what happens when I transfer $50,000..."

[Transfer without CIBA - executes immediately]

> "Executed immediately. No approval, no second factor. If my session was hijacked or the AI misunderstood my intent, that money is gone."

[Show unsecured diagram]

> "The diagram shows immediate execution - no human in the loop."

[Enable Async toggle]

> "Now let's enable CIBA - Client Initiated Backchannel Authentication..."

[Transfer with CIBA]

> "Notice the agent says 'waiting for approval'. In production, I'd get a push notification on my Auth0 Guardian app showing 'Transfer $50,000 to ACC999 - Approve or Deny?'"

[Wait for simulated approval]

> "After I approve on my mobile device - and this is key, a separate device - the transfer executes."

[Show secured diagram]

> "This sequence diagram shows the complete flow: the agent requests authorization, Auth0 sends a push to my mobile, I review and approve out-of-band, the agent polls until approved, then executes. This protects against session hijacking and AI misinterpretation."

### Closing (2 minutes)

**Say**:
> "So to summarize: We transformed an unsecured AI agent with three Auth0 features:"
>
> "1. **FGA** - Fine-grained authorization prevented data leaks by filtering based on actual permissions"
> "2. **Token Vault** - Secure OAuth token storage with encryption, audit logs, and lifecycle management"
> "3. **CIBA** - Out-of-band approval ensuring a human explicitly reviews high-risk operations"
>
> "And the interactive diagrams made the security visible and educational. Each feature has multiple visualization types showing exactly how Auth0 fits into the AI agent architecture."

---

## Tips for a Great Demo

### Before Demo

1. **Practice the flow** 2-3 times to get timing right
2. **Check backend logs** are visible in terminal (split screen)
3. **Size your browser** appropriately for the screen
4. **Test all toggles** work correctly
5. **Clear localStorage** for clean state

### During Demo

1. **Go slow**: Let diagrams render, give audience time to read
2. **Show backend logs**: Point out FGA checks and CIBA flow
3. **Toggle comparison**: Turn features on and off to show contrast
4. **Use all 3 diagram tabs** for FGA - the visualizer is unique
5. **Tell the story**: "Without Auth0 → data leak, With Auth0 → secure"

### Common Questions

**Q: Is this real FGA or mocked?**
A: Real Auth0 FGA with live checks against the FGA API. The tuples are pre-configured for the demo.

**Q: Does Token Vault really work?**
A: Simplified for demo. We read tokens from user's Google identity via Management API instead of full Connected Accounts flow (which has token exchange issues).

**Q: Is CIBA real?**
A: Currently simulated with 5-second auto-approval. Can be replaced with real Auth0 CIBA and Guardian mobile app.

**Q: Can I see other employees' data?**
A: Only if you add FGA tuples for your user. This demonstrates how FGA enforces organizational permissions.

---

## Variations and Extensions

### Extended Demo (Add 10 minutes)

1. **Show FGA Visualizer** for denied access:
   - Toggle FGA ON
   - Try: "show me payroll for EMP001"
   - FGA Visualizer shows dashed lines (missing relationship)

2. **Multiple users comparison**:
   - Show FGA tuples in dashboard
   - Demonstrate different users seeing different records

3. **Real CIBA with Guardian**:
   - Use actual Auth0 Guardian mobile app
   - Show push notification on device
   - Demonstrate denial flow

### Troubleshooting During Demo

**If FGA shows all records when ON**:
- Check backend logs for FGA errors
- Verify FGA tuples are correct
- May be running in mock mode

**If Token Vault connection fails**:
- Use mock data (already configured)
- Explain: "In production, this would retrieve real tokens from Auth0"

**If CIBA times out**:
- Check backend logs for errors
- Verify 5-second auto-approval is working
- Explain: "Real CIBA would wait for mobile approval"

---

## Post-Demo: Key Takeaways

### For Security Teams

1. **FGA is essential for RAG**: Authentication isn't enough - need permission filtering
2. **Token Vault centralizes OAuth**: Don't store tokens in app database
3. **CIBA adds critical approval**: High-risk AI operations need human oversight

### For Developers

1. **Toggle pattern**: Great for demos and testing security features
2. **Visual education**: Diagrams make complex security flows understandable
3. **LangChain integration**: Auth0 security layers integrate smoothly with AI agents

### For Business Stakeholders

1. **Compliance**: FGA + CIBA help meet regulatory requirements
2. **Risk mitigation**: Prevents data leaks, unauthorized access, and fraud
3. **User trust**: Transparent security builds confidence in AI systems

---

## Quick Reference Commands

```bash
# Start servers
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Check backend health
curl http://localhost:3001/api/health

# View backend logs
# Watch terminal running backend for FGA checks, CIBA flow, etc.

# Reset demo state
# Clear browser localStorage and refresh
# Turn all toggles OFF
```

---

## Appendix: Expected FGA Tuples

For user `auth0|698bad5bfa139d574a640089` (your test user):

```json
[
  {
    "user": "user:auth0|698bad5bfa139d574a640089",
    "relation": "viewer",
    "object": "payroll:EMP006"
  }
]
```

This grants viewer permission to only EMP006's payroll record.

To demo different scenarios, add/remove tuples in Auth0 FGA Dashboard.

---

## Demo Checklist

**Before Demo**:
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173
- [ ] Logged out (clear state)
- [ ] All toggles OFF
- [ ] Backend terminal visible (split screen)
- [ ] Browser sized appropriately

**During Demo**:
- [ ] Part 1: Unauthenticated experience
- [ ] Part 2: Login and identity
- [ ] Part 3: FGA toggle comparison
- [ ] Part 4: Token Vault connection flow
- [ ] Part 5: CIBA approval flow
- [ ] Show diagrams for each feature
- [ ] Highlight backend logs

**After Demo**:
- [ ] Reset state for next demo
- [ ] Close all diagram modals
- [ ] Logout user
- [ ] Turn toggles OFF

---

## Success Metrics

A successful demo shows:

1. ✅ Clear difference between secured and unsecured behavior
2. ✅ Diagrams appear automatically and render correctly
3. ✅ Backend logs show real FGA checks
4. ✅ Token Vault connection flow completes smoothly
5. ✅ CIBA approval process is visible
6. ✅ Audience understands WHY each security feature matters

---

## Contact

For questions or issues with the demo, refer to:
- [CLAUDE.md](CLAUDE.md) - Complete setup guide
- [SECURITY_ARCHITECTURE.md](SECURITY_ARCHITECTURE.md) - Architecture diagrams
- Auth0 Documentation - https://auth0.com/docs
