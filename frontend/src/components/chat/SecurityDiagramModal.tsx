import { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SecurityDiagramModalProps {
  isOpen: boolean
  onClose: () => void
  featureType: 'fga' | 'token-vault' | 'ciba'
  isSecured: boolean
}

type DiagramView = 'sequence' | 'architecture' | 'fga-visualizer'

// Initialize mermaid with configuration for large, readable diagrams
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  themeVariables: {
    fontSize: '56px',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    primaryColor: '#b3e5fc',
    primaryTextColor: '#000',
    primaryBorderColor: '#0288d1',
    lineColor: '#333',
    secondaryColor: '#fff9c4',
    tertiaryColor: '#c8e6c9',
    // Sequence diagram specific
    actorBorder: '#0288d1',
    actorBkg: '#e1f5ff',
    actorTextColor: '#000',
    actorLineColor: '#333',
    signalColor: '#000',
    signalTextColor: '#000',
    labelBoxBkgColor: '#fff9c4',
    labelBoxBorderColor: '#fbc02d',
    labelTextColor: '#000',
    loopTextColor: '#000',
    noteBorderColor: '#fbc02d',
    noteBkgColor: '#fff9c4',
    noteTextColor: '#000',
    activationBorderColor: '#0288d1',
    activationBkgColor: '#b3e5fc',
    sequenceNumberColor: '#fff',
  },
  securityLevel: 'loose',
  sequence: {
    diagramMarginX: 200,
    diagramMarginY: 100,
    actorMargin: 400,
    width: 1200,
    height: 320,
    boxMargin: 80,
    boxTextMargin: 60,
    noteMargin: 80,
    messageMargin: 200,
    mirrorActors: true,
    wrap: false,
    wrapPadding: 80,
    actorFontSize: 56,
    noteFontSize: 54,
    messageFontSize: 54,
    actorFontWeight: 700,
    messageFontWeight: 600,
    noteFontWeight: 600,
  },
  flowchart: {
    htmlLabels: true,
    curve: 'basis',
    padding: 20,
    nodeSpacing: 100,
    rankSpacing: 100,
    diagramPadding: 30,
  },
})

export default function SecurityDiagramModal({
  isOpen,
  onClose,
  featureType,
  isSecured,
}: SecurityDiagramModalProps) {
  const diagramRef = useRef<HTMLDivElement>(null)
  const [currentView, setCurrentView] = useState<DiagramView>('sequence')

  useEffect(() => {
    if (isOpen && diagramRef.current) {
      const diagram = getDiagram(featureType, isSecured, currentView)

      // Clear existing content
      diagramRef.current.innerHTML = ''

      // Create div for mermaid
      const div = document.createElement('div')
      div.className = 'mermaid'
      div.textContent = diagram
      diagramRef.current.appendChild(div)

      // Render mermaid diagram
      mermaid.run({ nodes: [div] }).catch(console.error)
    }
  }, [isOpen, featureType, isSecured, currentView])

  if (!isOpen) return null

  const title = getTitle(featureType, isSecured)
  const description = getDescription(featureType, isSecured)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-[95vw] max-w-[1800px] h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* View Tabs */}
        <div className="px-6 py-3 border-b bg-gray-50 dark:bg-gray-800 shrink-0">
          <div className="flex gap-2 items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">View:</span>
            <button
              onClick={() => setCurrentView('sequence')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'sequence'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Sequence Diagram
            </button>
            <button
              onClick={() => setCurrentView('architecture')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'architecture'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Architecture Diagram
            </button>
            {featureType === 'fga' && (
              <button
                onClick={() => setCurrentView('fga-visualizer')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'fga-visualizer'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                FGA Visualizer
              </button>
            )}
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              💡 Use browser zoom (Cmd/Ctrl + +) for even larger view
            </span>
          </div>
        </div>

        {/* Diagram Content */}
        <div className="flex-1 overflow-auto p-8 bg-white dark:bg-gray-950">
          {currentView === 'fga-visualizer' ? (
            <div
              ref={diagramRef}
              className="w-full overflow-auto"
              style={{
                fontSize: '18px',
                minHeight: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingTop: '20px',
              }}
            />
          ) : currentView === 'sequence' ? (
            <>
              <style>{`
                .mermaid svg {
                  font-family: ui-sans-serif, system-ui, sans-serif !important;
                }
                .mermaid line,
                .mermaid path.messageLine0,
                .mermaid path.messageLine1 {
                  stroke-width: 4px !important;
                }
                .mermaid rect.actor {
                  stroke-width: 4px !important;
                  rx: 8px !important;
                  ry: 8px !important;
                }
                .mermaid rect.note {
                  stroke-width: 3px !important;
                  rx: 6px !important;
                  ry: 6px !important;
                }
                .mermaid .activation0,
                .mermaid .activation1,
                .mermaid .activation2 {
                  stroke-width: 3px !important;
                }
                .mermaid marker path {
                  stroke-width: 3px !important;
                  fill: #333 !important;
                }
                .mermaid marker#arrowhead path,
                .mermaid marker#crosshead path,
                .mermaid marker#sequencenumber path {
                  stroke-width: 2px !important;
                  fill: #333 !important;
                }
                .mermaid defs marker {
                  transform: scale(2.5);
                  transform-origin: center;
                }
                .mermaid text {
                  font-weight: 700 !important;
                  font-size: 56px !important;
                }
                .mermaid .messageText {
                  font-weight: 600 !important;
                  font-size: 54px !important;
                  fill: #000 !important;
                  white-space: nowrap !important;
                }
                .mermaid .noteText {
                  font-weight: 600 !important;
                  font-size: 52px !important;
                  white-space: pre-wrap !important;
                  word-wrap: break-word !important;
                }
                .mermaid .actor-label {
                  white-space: nowrap !important;
                }
                .mermaid tspan {
                  dominant-baseline: central !important;
                }
              `}</style>
              <div
                ref={diagramRef}
                className="w-full overflow-auto"
                style={{
                  fontSize: '56px',
                  minHeight: '100%',
                }}
              />
            </>
          ) : (
            <div
              ref={diagramRef}
              className="w-full overflow-auto"
              style={{
                fontSize: '20px',
                minHeight: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                paddingTop: '20px',
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isSecured ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                  <span>Secured with Auth0</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500"></span>
                  <span>Unsecured - Potential vulnerabilities</span>
                </span>
              )}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getTitle(featureType: string, isSecured: boolean): string {
  const prefix = isSecured ? '🔒 Secured' : '⚠️ Unsecured'

  switch (featureType) {
    case 'fga':
      return `${prefix} RAG Pipeline`
    case 'token-vault':
      return `${prefix} OAuth Token Management`
    case 'ciba':
      return `${prefix} Transfer Operation`
    default:
      return 'How It Works'
  }
}

function getDescription(featureType: string, isSecured: boolean): string {
  switch (featureType) {
    case 'fga':
      return isSecured
        ? 'Auth0 FGA filters documents based on user permissions before sending to LLM'
        : 'Without FGA, all documents are retrieved regardless of user permissions'
    case 'token-vault':
      return isSecured
        ? 'Auth0 Token Vault securely stores and manages OAuth tokens with encryption and audit logging'
        : 'Without Token Vault, tokens are stored in application database with security risks'
    case 'ciba':
      return isSecured
        ? 'Auth0 CIBA requires out-of-band approval on mobile device before executing high-risk operations'
        : 'Without CIBA, operations execute immediately without second-factor verification'
    default:
      return ''
  }
}

function getDiagram(featureType: string, isSecured: boolean, view: DiagramView): string {
  // FGA Visualizer - shows authorization relationship graph
  if (view === 'fga-visualizer' && featureType === 'fga') {
    if (isSecured) {
      // Approved access visualization
      return `graph TD
    User[User: Alice] -->|has role| Employee[Employee Role]
    Employee -->|member of| Payroll[Payroll Group EMP006]
    Payroll -->|grants| ViewerRole[viewer relation]
    ViewerRole -->|allows| Permission[view_payroll permission]
    Permission -->|on| Resource[payroll:EMP006]

    Agent[AI Agent] -->|requests| Check{FGA Check}
    Check -->|evaluates| ViewerRole
    Check --> Result[✓ ALLOWED]

    Resource -->|authorized for| Result

    style User fill:#fff9c4,stroke:#fbc02d,stroke-width:3px
    style Agent fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style Employee fill:#c8e6c9,stroke:#43a047,stroke-width:2px
    style Payroll fill:#c8e6c9,stroke:#43a047,stroke-width:2px
    style ViewerRole fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    style Permission fill:#c8e6c9,stroke:#43a047,stroke-width:2px
    style Resource fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style Check fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
    style Result fill:#c8e6c9,stroke:#43a047,stroke-width:4px`
    } else {
      // Denied access visualization
      return `graph TD
    User[User: Alice] -.->|not member of| PayrollGroup[Required Payroll Group]
    PayrollGroup -.->|would grant| ViewerRole[viewer relation]
    ViewerRole -.->|would allow| Permission[view_payroll permission]
    Permission -.->|on| Resource[payroll:EMP001]

    Agent[AI Agent] -->|requests| Check{FGA Check}
    Check -->|evaluates| ViewerRole
    Check -->|no relationship| Denied[✗ DENIED]

    Resource -.->|not authorized| Denied

    style User fill:#fff9c4,stroke:#fbc02d,stroke-width:3px
    style Agent fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style PayrollGroup fill:#ffcdd2,stroke:#e53935,stroke-width:2px,stroke-dasharray: 5 5
    style ViewerRole fill:#ffcdd2,stroke:#e53935,stroke-width:2px,stroke-dasharray: 5 5
    style Permission fill:#ffcdd2,stroke:#e53935,stroke-width:2px,stroke-dasharray: 5 5
    style Resource fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style Check fill:#fff9c4,stroke:#fbc02d,stroke-width:2px
    style Denied fill:#ffcdd2,stroke:#e53935,stroke-width:4px`
    }
  }

  // Architecture view diagrams
  if (view === 'architecture') {
    if (featureType === 'fga') {
      if (isSecured) {
        return `flowchart TB
    User[User] --> Query[Show me 2024 payroll]
    Query --> Agent[AI Agent]
    Agent --> VectorDB[(Vector Database)]

    VectorDB --> Docs[Retrieved Documents]
    Docs --> FGA[Auth0 FGA Engine]
    FGA --> Check{Check Permissions}
    Check -->|Authorized| Allowed[Allowed Documents]
    Check -->|Denied| Filtered[Filtered Out]

    Allowed --> LLM[Language Model]
    LLM --> Response[Secure Response]
    Response --> User

    style FGA fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style Check fill:#fff9c4,stroke:#fbc02d,stroke-width:3px
    style Allowed fill:#c8e6c9,stroke:#43a047,stroke-width:3px
    style Filtered fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Response fill:#c8e6c9,stroke:#43a047,stroke-width:3px`
      } else {
        return `flowchart TB
    User[User] --> Query[Show me 2024 payroll]
    Query --> Agent[AI Agent]
    Agent --> VectorDB[(Vector Database)]

    VectorDB --> Docs[ALL Documents Retrieved]
    Docs --> Warning[No Permission Check]
    Warning --> LLM[Language Model]
    LLM --> Response[Response with Sensitive Data]
    Response --> User

    style Warning fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Docs fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Response fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style VectorDB fill:#ffcdd2,stroke:#e53935,stroke-width:3px`
      }
    } else if (featureType === 'token-vault') {
      if (isSecured) {
        return `flowchart TB
    User[User] --> App[Application]
    App --> Auth0[Auth0]
    Auth0 --> Vault[Token Vault - Encrypted Storage]

    Vault --> OAuth[OAuth Authorization]
    OAuth --> Google[Google APIs]

    Vault --> Refresh[Auto Refresh]
    Vault --> Audit[Audit Logs]
    Vault --> Encrypt[Encryption]

    Google --> Calendar[Calendar Data]
    Calendar --> App
    App --> User

    style Vault fill:#c8e6c9,stroke:#43a047,stroke-width:3px
    style Encrypt fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style Audit fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style Refresh fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style Calendar fill:#c8e6c9,stroke:#43a047,stroke-width:3px
    style Auth0 fill:#e1f5ff,stroke:#0288d1,stroke-width:3px`
      } else {
        return `flowchart TB
    User[User] --> App[Application]
    App --> AppDB[(Application Database)]
    AppDB --> Tokens[Tokens Stored with App Data]

    Tokens --> Google[Google APIs]

    Tokens --> Risk1[DB Breach Risk]
    Tokens --> Risk2[No Audit Trail]
    Tokens --> Risk3[Manual Refresh]

    Google --> Calendar[Calendar Data]
    Calendar --> App
    App --> User

    style Tokens fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk1 fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk2 fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk3 fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style AppDB fill:#ffcdd2,stroke:#e53935,stroke-width:3px`
      }
    } else if (featureType === 'ciba') {
      if (isSecured) {
        return `flowchart TB
    User[User] --> Request[Transfer $50,000]
    Request --> Agent[AI Agent]
    Agent --> Detect{High-Risk Operation?}

    Detect -->|Yes| CIBA[Auth0 CIBA]
    CIBA --> Push[Push Notification]
    Push --> Mobile[Auth0 Guardian Mobile]

    Mobile --> Review[User Reviews Transfer]
    Review --> Approve{Approve?}
    Approve -->|Yes| Token[Authorization Token]
    Approve -->|No| Deny[Denied]

    Token --> Execute[Execute Transfer]
    Execute --> Complete[Transfer Complete]
    Deny --> Blocked[Transfer Blocked]

    Complete --> User
    Blocked --> User

    style CIBA fill:#b3e5fc,stroke:#0288d1,stroke-width:3px
    style Mobile fill:#fff9c4,stroke:#fbc02d,stroke-width:3px
    style Review fill:#fff9c4,stroke:#fbc02d,stroke-width:3px
    style Token fill:#c8e6c9,stroke:#43a047,stroke-width:3px
    style Complete fill:#c8e6c9,stroke:#43a047,stroke-width:3px
    style Deny fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Blocked fill:#ffcdd2,stroke:#e53935,stroke-width:3px`
      } else {
        return `flowchart TB
    User[User] --> Request[Transfer $50,000]
    Request --> Agent[AI Agent]
    Agent --> Immediate[Immediate Execution]
    Immediate --> Execute[Execute Transfer]

    Immediate --> Risk1[No Second Factor]
    Immediate --> Risk2[Session Hijacking Risk]
    Immediate --> Risk3[AI Misinterpretation]
    Immediate --> Risk4[No User Review]

    Execute --> Complete[Transfer Complete]
    Complete --> User

    style Immediate fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Execute fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk1 fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk2 fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk3 fill:#ffcdd2,stroke:#e53935,stroke-width:3px
    style Risk4 fill:#ffcdd2,stroke:#e53935,stroke-width:3px`
      }
    }
    return ''
  }

  // Sequence view diagrams (existing code)
  if (featureType === 'fga') {
    if (isSecured) {
      return `sequenceDiagram
    participant User
    participant AI as AI Agent
    participant VDB as Vector DB
    participant FGA as Auth0 FGA
    participant LLM as LLM

    User->>AI: Show me 2024 payroll
    AI->>VDB: Query payroll documents
    VDB-->>AI: Return all matching docs

    rect rgb(200, 220, 255)
        Note over AI,FGA: Auth0 FGA Filtering
        loop For each document
            AI->>FGA: Check access permissions
            FGA-->>AI: Allow or deny
        end
        Note over AI: Filter to authorized only
    end

    AI->>LLM: Generate response with<br/>authorized docs only
    LLM-->>AI: Secure response
    AI-->>User: Display authorized data

    Note over User,LLM: Secured: User sees only permitted data`
    } else {
      return `sequenceDiagram
    participant User
    participant AI as AI Agent
    participant VDB as Vector DB
    participant LLM as LLM

    User->>AI: Show me 2024 payroll
    AI->>VDB: Query payroll documents
    VDB-->>AI: Return ALL documents<br/>(sensitive + public)
    Note over AI,VDB: No permission check
    AI->>LLM: Generate response using<br/>ALL retrieved documents
    LLM-->>AI: Response includes<br/>unauthorized data
    AI-->>User: Display all data

    Note over User,LLM: Risk: User sees unauthorized data`
    }
  } else if (featureType === 'token-vault') {
    if (isSecured) {
      return `sequenceDiagram
    participant User
    participant App as Application
    participant Auth0 as Auth0 Vault
    participant Google as Google

    User->>App: Connect Google Calendar
    App->>Auth0: Initiate OAuth
    Auth0->>Google: OAuth authorization
    Google-->>Auth0: Access + Refresh tokens

    rect rgb(200, 255, 200)
        Note over Auth0: Secure Storage
        Auth0->>Auth0: Store in Token Vault<br/>Encrypted & Isolated
    end

    User->>App: Show my calendar

    rect rgb(200, 220, 255)
        Note over App,Auth0: Secure Token Exchange
        App->>Auth0: Request token
        Auth0->>Auth0: Validate user
        Auth0-->>App: Return token
    end

    App->>Google: API call
    Google-->>App: Calendar data
    App-->>User: Display events

    Note over Auth0,Google: Encrypted storage, audit trail,<br/>automatic refresh`
    } else {
      return `sequenceDiagram
    participant User
    participant App as Application
    participant DB as App Database
    participant Google as Google

    User->>App: Connect Google Calendar
    App->>Google: OAuth authorization
    Google-->>App: Access + Refresh tokens

    rect rgb(255, 200, 200)
        Note over App,DB: Insecure Storage
        App->>DB: Store tokens in<br/>app database
    end

    User->>App: Show my calendar
    App->>DB: Retrieve token
    DB-->>App: Return token
    App->>Google: API call
    Google-->>App: Calendar data
    App-->>User: Display events

    Note over App,DB: Risks: Token exposure,<br/>no audit, manual refresh`
    }
  } else if (featureType === 'ciba') {
    if (isSecured) {
      return `sequenceDiagram
    participant User
    participant AI as AI Agent
    participant Auth0 as Auth0 CIBA
    participant Mobile as Guardian
    participant Backend as Backend

    User->>AI: Transfer $50,000

    rect rgb(200, 220, 255)
        Note over AI,Auth0: CIBA Initiation
        AI->>Auth0: POST /bc-authorize<br/>Transfer $50K
        Auth0-->>AI: auth_req_id
        Note over AI: Waiting for approval
    end

    rect rgb(255, 255, 200)
        Note over Auth0,Mobile: Out-of-Band Auth
        Auth0->>Mobile: Push notification
        Mobile->>Mobile: User reviews transfer
        Mobile->>Auth0: Approve
    end

    rect rgb(200, 255, 200)
        Note over AI,Auth0: Polling & Execute
        loop Poll every 5s
            AI->>Auth0: Check status
            Auth0-->>AI: pending...
        end
        Auth0-->>AI: Approved token
    end

    AI->>Backend: Execute transfer
    Backend-->>AI: Complete
    AI-->>User: Transfer executed

    Note over User,Backend: Secured: 2FA, out-of-band,<br/>explicit approval`
    } else {
      return `sequenceDiagram
    participant User
    participant AI as AI Agent
    participant Backend as Backend

    User->>AI: Transfer $50,000

    rect rgb(255, 200, 200)
        Note over AI,Backend: Immediate Execution
        AI->>Backend: Execute transfer
        Backend-->>AI: Complete
    end

    AI-->>User: Transfer successful

    Note over User,Backend: Risks: No 2FA, session hijacking,<br/>no approval, misinterpretation`
    }
  }

  return ''
}
